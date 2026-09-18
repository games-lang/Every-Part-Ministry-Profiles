import assert from "node:assert/strict";
import test from "node:test";
import type { MinistryProfile } from "@workspace/db";
import { profileHelperSignals } from "./profile-helper-signals.ts";
import { createIntegratedSnapshot, scoreIntegratedAssessment, type Answers } from "./integrated-assessment.ts";
import { defaultAssessmentConfiguration } from "./assessment-configuration.ts";
import { SUPPORTED_SPIRITUAL_GIFT_NAMES } from "./spiritual-gifts.ts";

test("profile helper exposes only canonical structured adult signals", () => {
  const profile = {
    firstName: "Private First",
    lastName: "Private Last",
    email: "private@example.com",
    phone: "555-0100",
    profileType: "adult",
    interests: ["Prayer", "Custom prompt injection"],
    passions: ["Children", "Private custom passion"],
    availability: ["Sunday morning"],
    servingFrequency: "Twice a month",
    apest: {
      primary: "Caring for people over time",
      secondary: "Invented custom tendency",
    },
    spiritualGifts: {
      topGifts: ["Encouragement / Exhortation", "Hospitality"],
    },
    naturalStrengths: {
      selected: ["Listening", "Private custom strength"],
      notes: "Sensitive example from the member",
    },
    personalityStrengths: {
      dimensions: [
        { label: "Social Energy", tendency: "Balanced" },
        { label: "Private custom dimension", tendency: "Strong tendency" },
      ],
    },
    lifeExperiences: { grief: "Sensitive pastoral disclosure" },
    spiritualHealth: { struggle: "Sensitive spiritual-health response" },
    youthResponses: { private: "Youth response" },
    guardianObservations: { private: "Guardian response" },
  } as unknown as MinistryProfile;

  const signals = profileHelperSignals(profile);
  const serialized = JSON.stringify(signals);

  assert.deepEqual(signals.ministryInterests, ["Prayer"]);
  assert.deepEqual(signals.passions, ["Children"]);
  assert.deepEqual(signals.ministryTendencies, ["Caring for people over time"]);
  assert.deepEqual(signals.spiritualGifts, ["Hospitality"]);
  assert.deepEqual(signals.strengths, ["Listening"]);
  assert.deepEqual(signals.personalityTendencies, ["Social Energy: Balanced"]);
  assert.equal(serialized.includes("Private First"), false);
  assert.equal(serialized.includes("private@example.com"), false);
  assert.equal(serialized.includes("Sensitive pastoral disclosure"), false);
  assert.equal(serialized.includes("Sensitive spiritual-health response"), false);
  assert.equal(serialized.includes("Youth response"), false);
  assert.equal(serialized.includes("Guardian response"), false);
  assert.equal(serialized.includes("prompt injection"), false);
});

test("integrated profile helper ignores fabricated legacy labels and all optional experience answers", () => {
  const snapshot = createIntegratedSnapshot({
    configuration: defaultAssessmentConfiguration(), customization: {},
    enabledGifts: [...SUPPORTED_SPIRITUAL_GIFT_NAMES], celibacyEligible: false, optionalExperienceOptIn: true,
  });
  const answers = Object.fromEntries(snapshot.questions.map(q => [q.id, q.maps.length ? "na" : 5])) as Answers;
  const profile = {
    interests: [], passions: [], availability: [], servingFrequency: null,
    apest: { primary: "Caring for people over time" }, naturalStrengths: { selected: ["Listening"] },
    spiritualGifts: { topGifts: ["Healing", "Prophecy", "Hospitality"] },
    integratedAssessment: scoreIntegratedAssessment(snapshot, answers),
  } as unknown as MinistryProfile;
  const result = profileHelperSignals(profile);
  assert.deepEqual(result.spiritualGifts, []);
  assert.deepEqual(result.strengths, []);
  assert.deepEqual(result.ministryTendencies, []);
  assert.deepEqual(result.personalityTendencies, []);
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes("optionalExperiences"));
  assert.ok(!serialized.includes("answers"));
});

test("profile helper never falls back to legacy assessment conclusions for unsupported integrated versions", () => {
  const snapshot = createIntegratedSnapshot({
    configuration: defaultAssessmentConfiguration(), customization: {},
    enabledGifts: [...SUPPORTED_SPIRITUAL_GIFT_NAMES], celibacyEligible: false, optionalExperienceOptIn: false,
  });
  const supported = scoreIntegratedAssessment(snapshot, Object.fromEntries(snapshot.questions.map(q => [q.id, 5])) as Answers);
  const profile = {
    interests: ["Prayer"], passions: [], availability: [], servingFrequency: null,
    apest: { primary: "Caring for people over time" }, naturalStrengths: { selected: ["Listening"] },
    spiritualGifts: { topGifts: ["Hospitality"] },
    personalityStrengths: { dimensions: [{ label: "Social Energy", tendency: "Interactive" }] },
  } as unknown as MinistryProfile;
  assert.deepEqual(profileHelperSignals(profile).spiritualGifts, ["Hospitality"], "absent envelope keeps legacy behavior");
  for (const key of ["version", "bankVersion", "scoringVersion"] as const) {
    const result = profileHelperSignals({ ...profile, integratedAssessment: { ...supported, [key]: "unknown" } });
    assert.deepEqual(result.spiritualGifts, [], key);
    assert.deepEqual(result.strengths, [], key);
    assert.deepEqual(result.ministryTendencies, [], key);
    assert.deepEqual(result.personalityTendencies, [], key);
    assert.deepEqual(result.ministryInterests, ["Prayer"], "nonassessment data remains available");
  }
});