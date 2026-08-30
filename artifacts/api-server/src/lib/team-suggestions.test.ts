import assert from "node:assert/strict";
import test from "node:test";
import type { MinistryProfile } from "@workspace/db";
import { teamSuggestionInternals } from "./team-suggestions.ts";

function profile(overrides: Partial<MinistryProfile> = {}): MinistryProfile {
  return {
    id: 1,
    churchId: 1,
    teamId: null,
    firstName: "Taylor",
    lastName: "Member",
    email: "private@example.com",
    phone: "555-0100",
    ageRange: null,
    preferredContact: null,
    familySituation: null,
    transportation: null,
    attendanceLength: null,
    connectionLevel: null,
    followingJesusLength: null,
    servedBefore: null,
    previousService: null,
    passions: ["Welcoming newcomers"],
    interests: ["Hospitality"],
    servingFrequency: null,
    availability: ["Sunday mornings"],
    occupation: "Private occupation",
    uniqueSkills: "Sensitive free-form skill detail",
    previousMinistryExperience: null,
    leadershipExperience: null,
    missionTripExperience: null,
    lifeExperience: null,
    apest: { responses: { "caregiver-0": 5, "teacher-0": 2 } },
    spiritualGifts: {
      responses: {
        Hospitality: [
          { prompt: "Private prompt", response: 5 },
          { prompt: "Private prompt", response: 4 },
          { prompt: "Private prompt", response: 5 },
        ],
      },
    },
    personalityStrengths: null,
    naturalStrengths: {
      responses: { "relationalConnection-0": 5, "organizing-0": 3 },
    },
    spiritualHealth: { privateReflection: "Never send this" },
    languages: null,
    churchDetails: null,
    skillsDetails: null,
    lifeExperiences: null,
    availabilityDetails: null,
    ministryPreferences: null,
    assessmentConfigurationSnapshot: null,
    completedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

test("AI-facing signal groups exclude names, contact details, and sensitive free text", () => {
  const safe = teamSuggestionInternals.toSafeProfile(profile());
  const signalGroups = teamSuggestionInternals.buildSignals([safe]);
  const serialized = JSON.stringify(signalGroups);

  assert.doesNotMatch(serialized, /Taylor|Member|private@example|555-0100/i);
  assert.doesNotMatch(serialized, /Sensitive free-form|Never send this|Private prompt/i);
  assert.match(serialized, /Hospitality/);
  assert.match(serialized, /Caring for people over time/);
  assert.match(serialized, /Relational connection/);
});

test("materialized suggestions derive reasons locally and flag current assignments", () => {
  const safeProfiles = [
    teamSuggestionInternals.toSafeProfile(profile({ teamId: 4 })),
  ];
  const signals = teamSuggestionInternals.buildSignals(safeProfiles);
  const hospitality = signals.find((signal) => signal.key === "interest:hospitality");
  assert.ok(hospitality);

  const [suggestion] = teamSuggestionInternals.materializeSuggestions(
    [
      {
        name: "Welcome Team",
        purpose: "Create a warm and thoughtful welcome for newcomers.",
        signalKeys: [hospitality.key],
      },
    ],
    signals,
    safeProfiles,
  );

  assert.equal(suggestion?.candidates[0]?.memberName, "Taylor Member");
  assert.equal(suggestion?.candidates[0]?.isAssigned, true);
  assert.deepEqual(suggestion?.candidates[0]?.reasons, [
    "Reflected Hospitality.",
    "Already assigned to a team; review before making any change.",
  ]);
});

test("fallback suggestions remain bounded and require no AI response", () => {
  const safeProfiles = [
    teamSuggestionInternals.toSafeProfile(profile()),
    teamSuggestionInternals.toSafeProfile(
      profile({ id: 2, firstName: "Jordan", interests: ["Hospitality"] }),
    ),
  ];
  const signals = teamSuggestionInternals.buildSignals(safeProfiles);
  const fallback = teamSuggestionInternals.fallbackSuggestions(signals);

  assert.ok(fallback.length > 0);
  assert.ok(fallback.length <= 4);
  assert.ok(fallback.every((suggestion) => suggestion.signalKeys.length === 1));
});