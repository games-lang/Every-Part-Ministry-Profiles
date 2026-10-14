import assert from "node:assert/strict";
import test from "node:test";
import {
  leadershipProfileResponse,
  normalizeLeadershipProfile,
  leadershipGuidanceInstructions,
  leadershipMatchingPreferences,
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

test("paused and unconfigured profiles use balanced style and standard length", () => {
  const configured = leadershipProfileResponse({
    profile: { coachingStyle: "direct", responseLength: "brief", priorities: ["Mentoring"] },
    personalizationEnabled: true, updatedAt: new Date(),
  });
  const defaults = leadershipGuidanceInstructions(leadershipProfileResponse(undefined));
  assert.match(leadershipGuidanceInstructions(configured).styleInstruction, /clear and concise/);
  assert.match(leadershipGuidanceInstructions(configured).lengthInstruction, /120 words/);
  for (const disabled of [{ ...configured, personalizationEnabled: false }, { ...configured, configured: false }]) {
    assert.deepEqual(leadershipGuidanceInstructions(disabled), defaults);
    assert.deepEqual(leadershipMatchingPreferences(disabled), {});
  }
  const detailed = { ...configured, coachingStyle: "encouraging" as const, responseLength: "detailed" as const };
  assert.match(leadershipGuidanceInstructions(detailed).styleInstruction, /Lead with encouragement/);
  assert.match(leadershipGuidanceInstructions(detailed).lengthInstruction, /500 words/);
  assert.deepEqual(leadershipGuidanceInstructions({ ...detailed, personalizationEnabled: false }), defaults);
});

test("local leadership preferences use only the requested saved fields", () => {
  const saved = leadershipProfileResponse({
    profile: {
      delegationNeeds: "Welcome guests", strengthenAreas: "Mentoring",
      priorities: ["Pray together"], churchChallenges: "Do not include me",
    },
    personalizationEnabled: true, updatedAt: new Date(),
  });
  assert.deepEqual(leadershipMatchingPreferences(saved), {
    preferenceTerms: ["Welcome guests", "Mentoring", "Pray together"],
    leadershipFocus: "Mentoring Pray together",
  });
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