import assert from "node:assert/strict";
import test from "node:test";
import { canRemoveChurchRecords } from "./church-removal-access.ts";

test("permanent removal is limited to owners, admins, and pastors", () => {
  assert.equal(canRemoveChurchRecords("owner"), true);
  assert.equal(canRemoveChurchRecords("admin"), true);
  assert.equal(canRemoveChurchRecords("pastor"), true);
  assert.equal(canRemoveChurchRecords("ministry_leader"), false);
  assert.equal(canRemoveChurchRecords("member"), false);
  assert.equal(canRemoveChurchRecords(undefined), false);
});