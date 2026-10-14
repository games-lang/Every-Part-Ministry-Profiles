import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import express, { type Request } from "express";
import type { AddressInfo } from "node:net";
import type { churchesTable } from "@workspace/db";
import type { CreateEmailOptions } from "resend";
import { completionJourneyUrl, queueProfileCompletionEmail, renderCompletionEmail, sendCompletionEmail } from "./completion-email";

const journeyUrl = "https://everypart.example/journey/PRIVATE_TEST_TOKEN";
const input = {
  to: "participant@example.test",
  memberName: "Jordan",
  churchName: "Grace Church",
  journeyUrl,
  replyTo: "pastor@grace.example",
  profileId: 42,
};
function logging() {
  const records: Array<{ fields: unknown; message: string }> = [];
  const write = (fields: unknown, message: string) => { records.push({ fields, message }); };
  return { records, log: { info: write, error: write } };
}
function request(origin = "https://everypart.example") {
  const url = new URL(origin);
  return {
    protocol: url.protocol.slice(0, -1),
    get: (name: string) => name === "host" ? url.host : "https://attacker.example",
  } as Pick<Request, "protocol" | "get">;
}

test("renderer contains only thanks, leader follow-up and one private journey link; no results leak", () => {
  const rendered = renderCompletionEmail({
    ...input,
    ...{ results: { apest: "SECRET_APEST", gifts: "SECRET_GIFTS", scores: "SECRET_SCORES" } },
  });
  assert.equal(rendered.subject, "Your Ministry Profile is ready — Grace Church");
  assert.doesNotMatch(rendered.subject, /PRIVATE_TEST_TOKEN/);
  for (const body of [rendered.html, rendered.text]) {
    assert.match(body, /Thank you, Jordan, for completing your Ministry Profile with Grace Church\./);
    assert.match(body, /Your church leader will follow up\./);
    assert.ok(body.includes(journeyUrl));
    assert.doesNotMatch(body, /SECRET_|APEST|scor(?:e|ing)|spiritual gifts|strengths|personality|assessment results|unsubscribe/i);
  }
  assert.equal((rendered.html.match(/<p>/g) ?? []).length, 3);
  assert.equal((rendered.html.match(/<a /g) ?? []).length, 1);
  assert.equal((rendered.text.match(/https:\/\//g) ?? []).length, 1);
});

test("HTML escapes names and rejects non-journey or unsafe links", () => {
  const rendered = renderCompletionEmail({ ...input, memberName: '<script>"Jordan"</script>', churchName: "Grace & Hope" });
  assert.doesNotMatch(rendered.html, /<script>/);
  assert.match(rendered.html, /&lt;script&gt;&quot;Jordan&quot;&lt;\/script&gt;/);
  assert.match(rendered.html, /Grace &amp; Hope/);
  for (const journeyUrl of ["javascript:alert(1)", "https://example.test/results/42", "https://example.test/journey/token?results=secret", "https://user:password@example.test/journey/token"]) {
    assert.throws(() => renderCompletionEmail({ ...input, journeyUrl }));
  }
});

test("private links use request origin or canonical APP_URL, never the untrusted Origin header", () => {
  assert.equal(completionJourneyUrl(request(), "PRIVATE_TEST_TOKEN"), journeyUrl);
  assert.equal(completionJourneyUrl(request("http://localhost:8080"), "token", "https://canonical.example/base"), "https://canonical.example/journey/token");
  assert.equal(completionJourneyUrl(request(), "a/b?c"), "https://everypart.example/journey/a%2Fb%3Fc");
  assert.throws(() => completionJourneyUrl(request(), ""));
  assert.throws(() => completionJourneyUrl(request(), "token", "javascript:alert(1)"));
});

test("missing key safely logs a skip without constructing or calling a provider", async () => {
  const l = logging();
  let calls = 0;
  await assert.doesNotReject(sendCompletionEmail({ ...input, journeyUrl: "invalid" }, {
    env: {}, log: l.log, deliver: async () => { calls++; return {}; },
  }));
  assert.equal(calls, 0);
  assert.match(l.records[0].message, /skipped.*RESEND_API_KEY/);
  assert.deepEqual(l.records[0].fields, { profileId: 42 });
});

test("send uses configured sender and church reply-to, with no extra profile data in payload", async () => {
  let message: CreateEmailOptions | undefined;
  await sendCompletionEmail(input, {
    env: { RESEND_API_KEY: "unit-test-only", COMPLETION_EMAIL_FROM: "Every Part <custom@example.test>" },
    log: logging().log,
    deliver: async (payload) => { message = payload; return { error: null }; },
  });
  assert.equal(message?.from, "Every Part <custom@example.test>");
  assert.equal(message?.replyTo, "pastor@grace.example");
  assert.equal(message?.to, input.to);
  assert.deepEqual(Object.keys(message!).sort(), ["from", "html", "replyTo", "subject", "text", "to"]);
});

test("thrown and returned Resend errors never reject and logs do not leak messages or tokens", async () => {
  for (const mode of ["throw", "return"] as const) {
    const l = logging();
    await assert.doesNotReject(sendCompletionEmail(input, {
      env: { RESEND_API_KEY: "unit-test-only" },
      log: l.log,
      deliver: async () => {
        const error = new Error(`Sensitive provider error: ${journeyUrl} ${input.to}`);
        if (mode === "throw") throw error;
        return { error };
      },
    }));
    assert.equal(l.records.length, 1);
    assert.deepEqual(l.records[0].fields, { profileId: 42 });
    assert.doesNotMatch(JSON.stringify(l.records), /PRIVATE_TEST_TOKEN|participant@example/);
  }
  const failLog = () => { throw new Error("Logger failure"); };
  await assert.doesNotReject(sendCompletionEmail(input, { env: {}, log: { info: failLog, error: failLog } }));
});

test("committed submissions return 201 before delayed Resend failures on all four completion paths", async (t) => {
  const l = logging();
  const saved = new Map<string, { id: number; email: string; firstName: string }>();
  const pending: Array<(error: Error) => void> = [];
  const messages: CreateEmailOptions[] = [];
  const church = { id: 7, name: "Grace Church", slug: "grace", adminEmail: "pastor@grace.example" } as typeof churchesTable.$inferSelect;
  const paths = ["/profiles", "/youth-profiles", "/explore-profiles", "/develop-profiles"];
  const app = express();
  for (const [index, path] of paths.entries()) {
    app.post(path, (req, res) => {
      // Simulate a committed save; exercise the exact shared post-commit hook
      // used by the production handlers, without writing real participant data.
      const created = { id: index + 1, email: index === 0 ? input.to : "guardian@example.test", firstName: "Jordan" };
      saved.set(path, created);
      queueProfileCompletionEmail({ request: req, profile: created, church, journeyAccessToken: "PRIVATE_TEST_TOKEN" }, {
        env: { RESEND_API_KEY: "unit-test-only", APP_URL: "https://everypart.example" },
        log: l.log,
        deliver: (message) => {
          messages.push(message);
          return new Promise((_resolve, reject) => pending.push(reject));
        },
      });
      res.status(201).json({ id: created.id });
    });
  }
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  for (const path of paths) {
    const response = await fetch(origin + path, { method: "POST" });
    assert.equal(response.status, 201, path);
    assert.deepEqual(await response.json(), { id: saved.get(path)!.id });
  }
  assert.equal(pending.length, 4);
  assert.equal(saved.size, 4);
  assert.equal(messages[0].from, "Every Part <noreply@everypart.church>");
  assert.equal(messages[1].to, "guardian@example.test");
  assert.equal(messages[1].replyTo, church.adminEmail);
  for (const reject of pending) reject(new Error(`Simulated Resend failure with ${journeyUrl}`));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(l.records.length, 4);
  assert.equal(saved.size, 4);
  assert.doesNotMatch(JSON.stringify(l.records), /PRIVATE_TEST_TOKEN|guardian@example/);
});

test("real completion handlers queue emails only after committed save and journey update, before 201", () => {
  const adult = readFileSync(new URL("../routes/profiles.ts", import.meta.url), "utf8");
  const youth = readFileSync(new URL("../routes/youth-profiles.ts", import.meta.url), "utf8");
  for (const [text, path] of [[adult, "/profiles"], [youth, "/youth-profiles"], [youth, "/explore-profiles"], [youth, "/develop-profiles"]]) {
    const start = text.indexOf(`router.post("${path}"`);
    assert.ok(start >= 0, path);
    const tail = text.slice(start);
    const next = tail.slice(1).search(/\nrouter\.(?:get|post|patch|delete)\(/);
    const route = next < 0 ? tail : tail.slice(0, next + 1);
    const update = route.indexOf("await updateJourneyAfterProfile");
    const queued = route.indexOf("queueProfileCompletionEmail({");
    const response = route.indexOf(".status(201)");
    assert.ok(update >= 0 && queued > update && response > queued, path);
    assert.doesNotMatch(route, /await queueProfileCompletionEmail/);
    assert.match(route.slice(update, queued), /catch/);
    assert.match(route.slice(queued, response), /profile: created, church, journeyAccessToken: journey.accessToken/);
  }
});
