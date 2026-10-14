import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import type { File } from "@google-cloud/storage";
import { RequestProfilePhotoUploadUrlBody, RequestUploadUrlBody } from "@workspace/api-zod";
import { ObjectStorageService } from "./objectStorage";

const limit = 5 * 1024 * 1024;
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const webp = Buffer.from("RIFF0000WEBP", "ascii");

test("both upload request schemas strictly enforce MIME types and integer sizes up to 5 MB", () => {
  for (const schema of [RequestUploadUrlBody, RequestProfilePhotoUploadUrlBody]) {
    const metadata = { name: "photo.png", churchSlug: "example" };
    for (const contentType of ["image/png", "image/jpeg", "image/webp"]) {
      for (const size of [1, limit]) {
        assert.equal(schema.safeParse({ ...metadata, size, contentType }).success, true);
      }
    }
    for (const size of [0, -1, limit + 1, 1.5, "100", null, NaN, Infinity]) {
      assert.equal(schema.safeParse({ ...metadata, size, contentType: "image/png" }).success, false);
    }
    for (const contentType of ["image/svg+xml", "image/gif", "text/html", "application/octet-stream", "image/png; charset=utf-8", "", null]) {
      assert.equal(schema.safeParse({ ...metadata, size: 100, contentType }).success, false);
    }
  }
});

for (const kind of ["logo", "photo"] as const) {
  const prefix = `/objects/${kind === "logo" ? "logos" : "profile-photos"}/7/`;
  const objectPath = `${prefix}84f0d606-dc93-42d8-9e6a-cd2b652192d9`;
  const validate = (service: ObjectStorageService, object = objectPath, church = 7) =>
    kind === "logo" ? service.validateChurchLogo(object, church) : service.validateProfilePhoto(object, church);

  function fixture(size: unknown, contentType: string, header: Buffer) {
    let deleted = false;
    const service = new ObjectStorageService();
    service.getObjectEntityFile = async () => ({
      getMetadata: async () => [{ size, contentType }],
      download: async () => [header],
      delete: async () => { deleted = true; },
    }) as unknown as File;
    return { service, wasDeleted: () => deleted };
  }

  test(`${kind}: stored byte count, MIME and signatures are checked before accepting or serving`, async () => {
    for (const [contentType, header] of [["image/png", png], ["image/jpeg", jpeg], ["image/webp", webp]] as const) {
      const f = fixture(String(limit), contentType, header);
      assert.equal((await validate(f.service)).contentType, contentType);
      assert.equal(f.wasDeleted(), false);
    }
    for (const size of ["invalid", "Infinity", "1.5", 0, -1, limit + 1]) {
      const f = fixture(size, "image/png", png);
      await assert.rejects(validate(f.service), /metadata is invalid/);
      assert.equal(f.wasDeleted(), true);
    }
    for (const [type, bytes] of [["text/html", png], ["image/svg+xml", png], ["image/png", jpeg], ["image/jpeg", webp], ["image/webp", png], ["image/png", Buffer.from("<svg/>")]] as const) {
      const f = fixture(100, type, bytes);
      await assert.rejects(validate(f.service), /invalid|do not match/);
      assert.equal(f.wasDeleted(), true);
    }
  });

  test(`${kind}: rejects another church or another asset purpose before accessing storage`, async () => {
    const service = new ObjectStorageService();
    service.getObjectEntityFile = async () => { throw new Error("Storage must not be accessed"); };
    await assert.rejects(validate(service, objectPath, 8), /does not belong/);
    await assert.rejects(validate(service, "/objects/other/7/photo"), /does not belong/);
  });
}

test("photo reads require trusted same-church leadership; anonymous upload and public logos remain separate", () => {
  const profiles = readFileSync(new URL("../routes/profiles.ts", import.meta.url), "utf8");
  const photoRoute = profiles.slice(profiles.indexOf('router.get("/profiles/:id/photo"'));
  assert.match(photoRoute, /requireUserId\(req, res\)/);
  assert.match(photoRoute, /requireChurchLeader\(userId, church.id, res\)/);
  assert.ok(photoRoute.indexOf("requireChurchLeader") < photoRoute.indexOf("storage.validateProfilePhoto"));
  assert.match(photoRoute, /eq\(ministryProfilesTable.churchId, church.id\)/);
  assert.match(photoRoute, /"private, no-store"/);
  const storage = readFileSync(new URL("../routes/storage.ts", import.meta.url), "utf8");
  const publicUpload = storage.slice(storage.indexOf('router.post("/storage/profile-photos/request-url"'));
  assert.doesNotMatch(publicUpload, /requireUserId|requireChurchLeader/);
  const service = readFileSync(new URL("./objectStorage.ts", import.meta.url), "utf8");
  assert.match(service, /\/logos\/\$\{churchId\}\/\$\{randomUUID\(\)\}/);
  assert.match(service, /\/profile-photos\/\$\{churchId\}\/\$\{randomUUID\(\)\}/);
  assert.doesNotMatch(storage, /router.get\(/);
});
