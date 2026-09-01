import assert from "node:assert/strict";
import test from "node:test";
import type { MinistryProfile } from "@workspace/db";
import {
  findVolunteerMatches,
  hasDuplicateAvailabilityChoices,
  profilesForChurch,
} from "./volunteer-matching.ts";

function profile(
  overrides: Partial<MinistryProfile> = {},
): MinistryProfile {
  return {
    id: 1,
    churchId: 10,
    firstName: "Alex",
    lastName: "Volunteer",
    email: "alex@example.com",
    phone: "555-0100",
    teamId: null,
    journeyId: null,
    ageRange: "Adult",
    profileType: "adult",
    recommendedProfileType: null,
    profileTypeOverridden: false,
    age: null,
    birthdate: null,
    personKey: "00000000-0000-4000-8000-000000000000",
    resultToken: "00000000-0000-4000-8000-000000000000",
    resultExpiresAt: null,
    youthResponses: null,
    guardianObservations: null,
    guardianName: null,
    guardianEmail: null,
    guardianConsent: null,
    preferredContact: "Email",
    familySituation: "Private",
    transportation: "Available",
    attendanceLength: "Several years",
    connectionLevel: 4,
    followingJesusLength: "Several years",
    servedBefore: true,
    previousService: "Welcome team",
    passions: ["Children"],
    interests: ["Teaching"],
    servingFrequency: "Weekly",
    availability: ["Sunday morning"],
    occupation: "Teacher",
    uniqueSkills: "Classroom teaching",
    previousMinistryExperience: "Children's ministry",
    leadershipExperience: null,
    missionTripExperience: null,
    lifeExperience: "Sensitive life detail",
    apest: null,
    spiritualGifts: null,
    personalityStrengths: {
      dimensions: [{ label: "Relational", tendency: "Warm" }],
    },
    naturalStrengths: { selected: ["Teaching"] },
    spiritualHealth: { privateAnswer: "do not expose" },
    languages: null,
    churchDetails: null,
    skillsDetails: { privateSkillDetail: "do not expose" },
    lifeExperiences: { privateExperience: "do not expose" },
    availabilityDetails: { privateAvailability: "do not expose" },
    ministryPreferences: { privatePreference: "do not expose" },
    assessmentConfigurationSnapshot: null,
    completedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

const criteria = {
  roleDescription:
    "Help children learn through a welcoming Sunday teaching role.",
  ministryArea: "Children",
  availability: ["Sunday morning"],
};

function withOpenAiKey<T>(callback: () => Promise<T>): Promise<T> {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  return callback().finally(() => {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  });
}

test("scopes matching input to one church and refuses mixed-tenant input", async () => {
  const ownProfile = profile({ id: 1, churchId: 10 });
  const otherChurchProfile = profile({
    id: 2,
    churchId: 20,
    firstName: "Other",
    lastName: "Church",
  });

  assert.deepEqual(
    profilesForChurch([ownProfile, otherChurchProfile], 10).map(
      ({ id }) => id,
    ),
    [1],
  );
  const result = await findVolunteerMatches(
    [ownProfile, otherChurchProfile],
    criteria,
    10,
  );
  assert.deepEqual(result.candidates.map(({ id }) => id), [1]);
  const mixedInputResult = await findVolunteerMatches(
    [ownProfile, otherChurchProfile],
    criteria,
  );
  assert.equal(mixedInputResult.candidates.length, 0);
});

test("rejects duplicate availability choices after normalization", () => {
  assert.equal(hasDuplicateAvailabilityChoices(["Sunday", "Sunday"]), true);
  assert.equal(
    hasDuplicateAvailabilityChoices(["Sunday morning", " sunday morning "]),
    true,
  );
  assert.equal(
    hasDuplicateAvailabilityChoices(["Sunday morning", "Wednesday evening"]),
    false,
  );
  assert.equal(hasDuplicateAvailabilityChoices(undefined), false);
});

test("excludes profiles with no locally verified overlap", async () => {
  const result = await findVolunteerMatches(
    [
      profile({
        id: 1,
        interests: ["Gardening"],
        passions: ["Landscaping"],
        availability: ["Tuesday evening"],
        uniqueSkills: null,
        previousMinistryExperience: null,
        naturalStrengths: null,
      }),
    ],
    {
      roleDescription:
        "Help children learn through a welcoming Sunday teaching role.",
    },
    10,
  );
  assert.deepEqual(result.candidates, []);
  assert.match(result.summary, /No profiles had enough relevant evidence/);
});

test("only allows verified candidate IDs through malformed AI output", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                rankings: [
                  { id: 9999, score: 100 },
                  { id: 1, score: 80 },
                  { id: 1, score: 20 },
                  { id: "not-an-id", score: 100 },
                ],
              }),
            },
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  try {
    const result = await withOpenAiKey(() =>
      findVolunteerMatches([profile()], criteria, 10),
    );
    assert.equal(result.usedAi, true);
    assert.deepEqual(result.candidates.map(({ id }) => id), [1]);
    assert.equal(new Set(result.candidates.map(({ id }) => id)).size, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("falls back to local evidence without contact or sensitive fields", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("model unavailable");
  };

  try {
    const result = await withOpenAiKey(() =>
      findVolunteerMatches([profile()], criteria, 10),
    );
    assert.equal(result.usedAi, false);
    assert.deepEqual(Object.keys(result.candidates[0] ?? {}).sort(), [
      "availability",
      "id",
      "interests",
      "matchLevel",
      "memberName",
      "passions",
      "reasons",
      "score",
      "servingFrequency",
    ]);
    const responseText = JSON.stringify(result);
    for (const sensitiveValue of [
      "alex@example.com",
      "555-0100",
      "Sensitive life detail",
      "do not expose",
    ]) {
      assert.equal(responseText.includes(sensitiveValue), false);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});