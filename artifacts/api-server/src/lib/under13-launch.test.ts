import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import express from "express";
import youthRoutes from "../routes/youth-profiles.ts";
import churchRoutes from "../routes/churches.ts";
import { UNDER_13_PROFILES_ENABLED, UNDER_13_UNAVAILABLE_MESSAGE } from "./assessment-configuration.ts";
import { pathwayForAge } from "./youth-profiles.ts";

test("under-13 launch defaults off without changing age classification or stored youth definitions", () => {
  assert.equal(UNDER_13_PROFILES_ENABLED, false);
  assert.equal(pathwayForAge(6), "discover");
  assert.equal(pathwayForAge(12), "explore");
  assert.equal(pathwayForAge(13), "develop");
  assert.equal(pathwayForAge(18), "adult");
});

test("real Discover, Explore, and hallway-access handlers refuse gracefully before auth or database work", async (t) => {
  const app = express();
  app.use(express.json());
  app.use("/api", youthRoutes, churchRoutes);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  for (const path of ["/api/youth-profiles", "/api/explore-profiles", "/api/churches/example/discover-access"]) {
    for (const body of [{}, { age: 8, hallwayCode: "ABCDEF", profileTypeOverridden: true }]) {
      const response = await fetch(`${base}${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      assert.equal(response.status, 403, path);
      assert.deepEqual(await response.json(), { error: UNDER_13_UNAVAILABLE_MESSAGE });
    }
  }
});

test("server exposes one launch flag and prevents under-13 adult or teen override bypasses", () => {
  const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  assert.match(source("./churches.ts"), /under13ProfilesEnabled: UNDER_13_PROFILES_ENABLED/);
  const churches = source("../routes/churches.ts");
  assert.match(churches, /under13ProfilesEnabled: UNDER_13_PROFILES_ENABLED/);
  assert.match(churches, /discoverAccessAvailable: UNDER_13_PROFILES_ENABLED && Boolean/);
  const adult = source("../routes/profiles.ts").split('router.post("/profiles"')[1].split('router.patch(')[0];
  const teen = source("../routes/youth-profiles.ts").split('router.post("/develop-profiles"')[1].split('router.get(')[0];
  for (const handler of [adult, teen]) {
    assert.match(handler, /!UNDER_13_PROFILES_ENABLED && parsed.data.age < 13/);
    assert.ok(handler.indexOf("parsed.data.age < 13") < handler.indexOf("const [church]"));
  }
  const historical = source("../routes/youth-profiles.ts").split('router.get(').slice(1);
  assert.equal(historical.length, 3);
  for (const handler of historical) {
    assert.doesNotMatch(handler.split('router.post(')[0], /UNDER_13_PROFILES_ENABLED/);
  }
});
