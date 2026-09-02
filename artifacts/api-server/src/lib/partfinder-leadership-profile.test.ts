import assert from "node:assert/strict";
import test from "node:test";
import {
  leadershipProfileResponse,
  normalizeLeadershipProfile,
} from "./partfinder-leadership-profile-data.ts";

test("PartFinder leadership profile normalizes and limits intentionally saved context", () => {
    const normalized = normalizeLeadershipProfile({
      priorities: ["  Develop leaders  ", "", "Follow up", "Protect time"],
      energizingAreas: "  Mentoring people  ",
      leadershipStrengths: ["Vision", "Vision", "Listening"],
      helpPreferences: ["delegate", "develop-leaders"],
      coachingStyle: "direct",
      responseLength: "brief",
    });

  assert.deepEqual(normalized.priorities, ["Develop leaders", "Follow up", "Protect time"]);
  assert.equal(normalized.energizingAreas, "Mentoring people");
  assert.deepEqual(normalized.leadershipStrengths, ["Vision", "Listening"]);
  assert.equal(normalized.coachingStyle, "direct");
  assert.equal(normalized.responseLength, "brief");
});

test("PartFinder leadership profile defaults do not invent memory", () => {
  assert.deepEqual(
    leadershipProfileResponse(undefined),
    {
      energizingAreas: "",
      drainingAreas: "",
      delegationNeeds: "",
      churchChallenges: "",
      strengthenAreas: "",
      leadersToDevelop: "",
      goals3Months: "",
      goals1Year: "",
      coachingStyle: "balanced",
      responseLength: "standard",
      configured: false,
      personalizationEnabled: true,
      priorities: [],
      leadershipStrengths: [],
      growthAreas: [],
      helpPreferences: [],
      updatedAt: null,
    },
  );
});