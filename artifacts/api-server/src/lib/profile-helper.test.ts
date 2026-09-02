import assert from "node:assert/strict";
import test from "node:test";
import type { MinistryProfile } from "@workspace/db";
import { profileHelperSignals } from "./profile-helper-signals.ts";

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