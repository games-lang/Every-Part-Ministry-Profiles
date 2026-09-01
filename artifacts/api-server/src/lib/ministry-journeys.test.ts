import test from "node:test";
import assert from "node:assert/strict";
import {
  compareProfiles,
  journeyPatterns,
  nextProfileFor,
  profileThemes,
  publicJourneyProfile,
} from "./ministry-journeys.ts";
import type { MinistryProfile } from "@workspace/db";

function adultProfile(
  id: number,
  completedAt: string,
  passions: string[],
  interests: string[],
): MinistryProfile {
  return {
    id,
    profileType: "adult",
    completedAt: new Date(completedAt),
    passions,
    interests,
    firstName: "Jordan",
    lastName: "Rivera",
    age: null,
  } as unknown as MinistryProfile;
}

test("journey chapters advance through the youth pathways and end with adult check-ins", () => {
  assert.equal(nextProfileFor("discover"), "explore");
  assert.equal(nextProfileFor("explore"), "develop");
  assert.equal(nextProfileFor("develop"), "adult");
  assert.equal(nextProfileFor("adult"), null);
});

test("journey patterns are normalized and keep consistent themes separate from emerging ones", () => {
  const profiles = [
    adultProfile(1, "2024-01-01", ["Prayer"], ["Welcome"]),
    adultProfile(2, "2025-01-01", ["prayer"], ["Welcome"]),
    adultProfile(3, "2026-01-01", ["Prayer"], ["Students"]),
  ];

  assert.deepEqual(profileThemes(profiles[0]), ["Prayer", "Welcome"]);
  assert.deepEqual(journeyPatterns(profiles), {
    consistent: ["prayer", "welcome"],
    emerging: ["Students"],
  });
});

test("chapter comparison is advisory and only returns canonical theme intersections", () => {
  const left = adultProfile(10, "2024-01-01", ["Prayer", "Welcome"], ["Care"]);
  const right = adultProfile(11, "2025-01-01", ["prayer", "Students"], ["Care"]);
  const comparison = compareProfiles(left, right);

  assert.deepEqual(comparison.sharedThemes, ["Prayer", "Care"]);
  assert.deepEqual(comparison.emergingThemes, ["Students"]);
  assert.match(comparison.note, /not a score, diagnosis, or placement recommendation/);
});

test("public chapter summaries omit contact and raw profile fields", () => {
  const profile = {
    ...adultProfile(12, "2025-05-01", ["Hospitality"], []),
    email: "private@example.com",
    phone: "555-0100",
    guardianEmail: "guardian@example.com",
    youthResponses: { raw: "private" },
  };
  const summary = publicJourneyProfile(profile);

  assert.deepEqual(Object.keys(summary).sort(), [
    "age",
    "completedAt",
    "id",
    "memberName",
    "profileLabel",
    "profileType",
    "themes",
  ]);
  assert.equal("email" in summary, false);
  assert.equal("youthResponses" in summary, false);
});