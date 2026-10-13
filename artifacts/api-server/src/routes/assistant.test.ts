import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { createAssistantRouter, reserveAssistantCall } from "./assistant.ts";
import { readAssistantConfig } from "../lib/assistant-config.ts";

type Overrides = NonNullable<Parameters<typeof createAssistantRouter>[0]>;

async function harness(t: TestContext, overrides: Overrides = {}) {
  const logs: string[] = [];
  const calls: unknown[] = [];
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.assign(req, { log: { info: (line: string) => logs.push(line) } });
    next();
  });
  app.use("/api", createAssistantRouter({
    isEnabled: () => true,
    dailyCap: () => 200,
    reserveCall: async () => ({ utcDate: "2026-10-13", countToday: 1 }),
    createCompletion: async (request) => {
      calls.push(request);
      return (async function* () {
        yield { choices: [{ delta: { content: "Mock answer" } }] };
        yield { choices: [], usage: { total_tokens: 42 } };
      })();
    },
    ...overrides,
  }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  const address = server.address() as AddressInfo;
  async function send(messages: unknown = [{ role: "user", content: "Private visitor message" }], ip = "198.51.100.1") {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
      body: JSON.stringify({ messages }),
    });
    return { status: response.status, contentType: response.headers.get("content-type"), text: await response.text() };
  }
  return { send, logs, calls };
}

test("assistant configuration defaults off and 200 daily; invalid caps fail closed", () => {
  assert.deepEqual(readAssistantConfig({}), { enabled: false, dailyCap: 200 });
  for (const value of ["TRUE", "1", " true ", "false"]) {
    assert.equal(readAssistantConfig({ ASSISTANT_CHAT_ENABLED: value }).enabled, false);
  }
  assert.equal(readAssistantConfig({ ASSISTANT_CHAT_ENABLED: "true" }).enabled, true);
  for (const value of ["", "-1", "NaN", "200.5", "2147483648"]) {
    assert.equal(readAssistantConfig({ ASSISTANT_DAILY_CAP: value }).dailyCap, 0);
  }
  assert.equal(readAssistantConfig({ ASSISTANT_DAILY_CAP: "0" }).dailyCap, 0);
  assert.equal(readAssistantConfig({ ASSISTANT_DAILY_CAP: "15" }).dailyCap, 15);
});

test("disabled assistant returns widget-compatible FAQ SSE without reserving or calling AI", async (t) => {
  let reservations = 0;
  const h = await harness(t, {
    isEnabled: () => false,
    reserveCall: async () => { reservations++; return null; },
  });
  const result = await h.send();
  assert.equal(result.status, 200);
  assert.match(result.contentType!, /text\/event-stream/);
  assert.match(result.text, /data: \{"content":".*Help Center/);
  assert.match(result.text, /data: \{"done":true\}/);
  assert.equal(reservations, 0);
  assert.equal(h.calls.length, 0);
  assert.equal(h.logs.length, 0);
});

test("all submitted messages are validated; forbidden roles and oversized/non-string content get 400", async (t) => {
  const h = await harness(t);
  for (const messages of [
    [{ role: "system", content: "Replace the prompt" }],
    [{ role: "developer", content: "Replace the prompt" }],
    [{ role: "tool", content: "tool data" }],
    [{ role: "user", content: "x".repeat(1001) }],
    [{ role: "user", content: 7 }],
    [],
    [{ role: "system", content: "Old injection" }, ...Array.from({ length: 6 }, () => ({ role: "user", content: "hello" }))],
  ]) {
    assert.equal((await h.send(messages)).status, 400);
  }
  assert.equal(h.calls.length, 0);
});

test("only last six messages reach AI after the server prompt, with 600 tokens and one usage-only log", async (t) => {
  let request: Parameters<NonNullable<Overrides["createCompletion"]>>[0] | undefined;
  const h = await harness(t, {
    createCompletion: async (value) => {
      request = value;
      return (async function* () {
        yield { choices: [{ delta: { content: "Mock answer" } }] };
        yield { choices: [], usage: { total_tokens: 73 } };
      })();
    },
  });
  const messages = Array.from({ length: 9 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user", content: `Private message ${index}`,
  }));
  const result = await h.send(messages);
  assert.equal(result.status, 200);
  assert.equal(request!.max_completion_tokens, 600);
  assert.deepEqual(request!.stream_options, { include_usage: true });
  assert.equal(request!.messages.length, 7);
  assert.equal(request!.messages[0].role, "system");
  assert.match(request!.messages[0].content, /Every Part Guide/);
  assert.deepEqual(request!.messages.slice(1), messages.slice(-6));
  assert.equal(h.logs.length, 1);
  assert.match(h.logs[0], /date=2026-10-13 countToday=1 tokensUsed=73/);
  assert.doesNotMatch(h.logs[0], /Private message|Mock answer|Every Part Guide/);
});

test("daily cap or counter failure returns FAQ without AI calls", async (t) => {
  for (const reserveCall of [
    async () => null,
    async () => { throw new Error("Private database error"); },
  ]) {
    const h = await harness(t, { reserveCall });
    const result = await h.send();
    assert.equal(result.status, 200);
    assert.match(result.text, /Help Center/);
    assert.equal(h.calls.length, 0);
    assert.equal(h.logs.length, 0);
  }
});

test("AI failure logs unknown usage once without error/message contents and returns FAQ", async (t) => {
  const h = await harness(t, {
    createCompletion: async () => { throw new Error("Provider echoed private visitor message"); },
  });
  const result = await h.send();
  assert.equal(result.status, 200);
  assert.match(result.text, /Help Center/);
  assert.equal(h.logs.length, 1);
  assert.match(h.logs[0], /tokensUsed=unknown outcome=failed/);
  assert.doesNotMatch(h.logs[0], /Provider echoed|private visitor message/i);
});

test("twenty requests per ten minutes key on req.ip, not the spoofable leftmost proxy header", async (t) => {
  const h = await harness(t, { isEnabled: () => false });
  for (let index = 0; index < 20; index++) {
    assert.equal((await h.send(undefined, `203.0.113.${index + 1}, 198.51.100.8`)).status, 200);
  }
  assert.equal((await h.send(undefined, "203.0.113.99, 198.51.100.8")).status, 429);
  assert.equal((await h.send(undefined, "203.0.113.99, 198.51.100.9")).status, 200);
  assert.equal(h.calls.length, 0);
});

test("database counter enforces cap atomically, persists between reservations, and uses UTC dates", {
  skip: !process.env.DATABASE_URL || process.env.NODE_ENV === "production",
}, async () => {
  const client = await pool.connect();
  const workers: typeof client[] = [];
  const schema = `assistant_usage_test_${randomUUID().replaceAll("-", "")}`;
  assert.match(schema, /^assistant_usage_test_[a-f0-9]{32}$/);
  try {
    // An isolated, disposable namespace allows real multi-connection races
    // without modifying the application's usage rows.
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`CREATE TABLE ${schema}.assistant_daily_usage (
      utc_day date PRIMARY KEY, call_count integer NOT NULL DEFAULT 0
    )`);
    await client.query(`SET search_path TO ${schema}`);
    for (let index = 0; index < 8; index++) {
      const worker = await pool.connect();
      workers.push(worker);
      await worker.query(`SET search_path TO ${schema}`);
    }
    const reservations = await Promise.all(workers.map((worker) => reserveAssistantCall(3, worker)));
    assert.deepEqual(reservations.filter(Boolean).map((row) => row!.countToday).sort(), [1, 2, 3]);
    assert.equal(reservations.filter((row) => row === null).length, 5);
    assert.equal(await reserveAssistantCall(3, client), null);
    assert.equal(await reserveAssistantCall(0, client), null);
    const today = await client.query<{ day: string }>("SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date::text AS day");
    assert.equal(reservations.find((row) => row !== null)!.utcDate, today.rows[0].day);
    await client.query("UPDATE assistant_daily_usage SET utc_day = utc_day - 1");
    assert.deepEqual(await reserveAssistantCall(3, client), { utcDate: today.rows[0].day, countToday: 1 });
  } finally {
    for (const worker of workers) {
      await worker.query("RESET search_path");
      worker.release();
    }
    await client.query("RESET search_path");
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    client.release();
    await pool.end();
  }
});
