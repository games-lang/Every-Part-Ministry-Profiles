import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createWebServer } from "./serve.mjs";
import securityHeaders from "../../config/security-headers.json" with { type: "json" };

test("production web server gives HTML deep links, assets and errors all five security headers", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "everypart-headers-"));
  const root = path.join(directory, "public");
  await mkdir(path.join(root, "assets"), { recursive: true });
  await writeFile(path.join(root, "index.html"), "<!doctype html><title>Every Part</title>");
  await writeFile(path.join(root, "assets", "app.js"), "console.log('app');");
  await writeFile(path.join(root, "assets", "app.css"), "body { color: teal; }");
  await writeFile(path.join(directory, "private.txt"), "must never be served");
  await symlink(path.join(directory, "private.txt"), path.join(root, "leak.txt"));
  const server = createWebServer(root).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const page of ["/", "/sign-in", "/sign-up", "/sign-in/sso-callback", "/discover", "/help/article", "/profiles/42", "/unknown/path"]) {
    const response = await fetch(base + page);
    assert.equal(response.status, 200, page);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(await response.text(), /Every Part/);
    for (const [name, value] of Object.entries(securityHeaders)) assert.equal(response.headers.get(name), value, `${page}: ${name}`);
  }
  for (const [url, status, type] of [
    ["/assets/app.js", 200, "text/javascript"],
    ["/assets/app.css", 200, "text/css"],
    ["/assets/missing.js", 404, "text/plain"],
    ["/favicon.svg", 404, "text/plain"],
    ["/leak.txt", 403, "text/plain"],
    ["/%2e%2e%2fprivate.txt", 403, "text/plain"],
    ["/%zz", 400, "text/plain"],
  ]) {
    const response = await fetch(base + url);
    assert.equal(response.status, status, url);
    assert.ok(response.headers.get("content-type").startsWith(type));
    for (const [name, value] of Object.entries(securityHeaders)) assert.equal(response.headers.get(name), value);
    assert.doesNotMatch(await response.text(), /must never be served/);
  }
  const head = await fetch(base + "/discover", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.ok(Number(head.headers.get("content-length")) > 0);
  assert.equal(await head.text(), "");
  const post = await fetch(base + "/discover", { method: "POST" });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
  assert.equal(post.headers.get("x-frame-options"), "SAMEORIGIN");
});

test("CSP pins framing to self and prohibits inline scripts while allowing observed runtime needs", () => {
  const policy = securityHeaders["Content-Security-Policy"];
  assert.match(policy, /(?:^|; )frame-ancestors 'self'(?:;|$)/);
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /object-src 'none'/);
  assert.doesNotMatch(policy.match(/script-src[^;]+/)[0], /unsafe-inline|https: | \*/);
  assert.match(policy, /script-src 'self' 'unsafe-eval'/);
  assert.match(policy, /worker-src 'self' blob:/);
  assert.match(policy, /style-src 'self' 'unsafe-inline' https:\/\/fonts.googleapis.com/);
});
