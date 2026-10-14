import assert from "node:assert/strict";
import test from "node:test";
import type { MinistryProfile } from "@workspace/db";
import {
  findVolunteerMatches,
  hasDuplicateAvailabilityChoices,
  profilesForChurch,
} from "./volunteer-matching.ts";
import { leadershipMatchingPreferences, leadershipProfileResponse } from "./partfinder-leadership-profile-data.ts";

function profile(
  overrides: Partial<MinistryProfile> = {},
): MinistryProfile {
  return {
    integratedAssessment: null,
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
    profilePhotoPath: null,
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
    ministryCustomizationSnapshot: null,
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

test("leadership preferences lift evidence-backed ties only and stay out of AI payloads", async () => {
  const originalFetch = globalThis.fetch;
  const payloads: string[] = [];
  globalThis.fetch = async (_input, init) => {
    payloads.push(String(init?.body));
    return new Response("{}", { status: 503 });
  };
  try {
    await withOpenAiKey(async () => {
      const people = [
        profile({ id: 1, interests: ["Teaching"], passions: [], uniqueSkills: null, previousMinistryExperience: null, naturalStrengths: null }),
        profile({ id: 2, interests: ["Teaching"], passions: ["Hospitality"], uniqueSkills: null, previousMinistryExperience: null, naturalStrengths: null }),
        profile({ id: 3, interests: ["Hospitality"], passions: [], availability: [], uniqueSkills: null, previousMinistryExperience: null, naturalStrengths: null }),
        profile({ id: 4, interests: ["Teaching"], passions: ["Teaching"], uniqueSkills: null, previousMinistryExperience: null, naturalStrengths: null }),
      ];
      const need = { roleDescription: "Teaching" };
      const baseline = await findVolunteerMatches(people, need, 10);
      const saved = leadershipProfileResponse({
        profile: { delegationNeeds: "welcome newcomers SECRET_LOCAL_ONLY" },
        personalizationEnabled: true, updatedAt: new Date(),
      });
      const active = await findVolunteerMatches(people, { ...need, ...leadershipMatchingPreferences(saved) }, 10);
      assert.deepEqual(active.candidates.map(({ id }) => id), [4, 2, 1]);
      assert.ok(!active.candidates.some(({ id }) => id === 3));
      const boosted = active.candidates.find(({ id }) => id === 2)!;
      assert.equal(boosted.score, baseline.candidates.find(({ id }) => id === 2)!.score + 3);
      assert.ok(boosted.reasons.includes("Connects with an area you marked in My Leadership."));
      for (const off of [{ ...saved, configured: false }, { ...saved, personalizationEnabled: false }]) {
        assert.deepEqual(await findVolunteerMatches(people, { ...need, ...leadershipMatchingPreferences(off) }, 10), baseline);
      }
      assert.deepEqual(await findVolunteerMatches(people, { ...need, preferenceTerms: ["astronomy"] }, 10), baseline);
      for (const payload of payloads) {
        assert.doesNotMatch(payload, /SECRET_LOCAL_ONLY|preferenceTerms|welcome newcomers/);
      }
    });
  } finally { globalThis.fetch = originalFetch; }
});

test("AI ranking is personalized locally; unmatched preferences preserve its exact output", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    assert.doesNotMatch(String(init?.body), /LOCAL_ONLY|preferenceTerms|welcome guests/);
    return Response.json({ choices: [{ message: {
      content: JSON.stringify({ rankings: [{ id: 1, score: 50 }, { id: 2, score: 50 }] }),
    } }] });
  };
  try {
    await withOpenAiKey(async () => {
      const people = [
        profile({ id: 1, passions: [] }),
        profile({ id: 2, passions: ["Hospitality"] }),
      ];
      const baseline = await findVolunteerMatches(people, { roleDescription: "Teaching" }, 10);
      assert.equal(baseline.usedAi, true);
      const active = await findVolunteerMatches(people, { roleDescription: "Teaching", preferenceTerms: ["welcome guests LOCAL_ONLY"] }, 10);
      assert.equal(active.usedAi, true);
      assert.deepEqual(active.candidates.map(({ id }) => id), [2, 1]);
      assert.equal(active.candidates[0].score, baseline.candidates[1].score + 3);
      const unmatched = await findVolunteerMatches(people, { roleDescription: "Teaching", preferenceTerms: ["LOCAL_ONLY astronomy"] }, 10);
      assert.deepEqual(unmatched, baseline);
    });
  } finally { globalThis.fetch = originalFetch; }
});

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

test("volunteer matching never substitutes legacy conclusions for unsupported integrated versions", async () => {
  const versions = { version: "integrated-assessment-v1", bankVersion: "adult-integrated-83-v1", scoringVersion: "independent-weighted-mean-v1" };
  const fixture = profile({
    interests: [], passions: [], availability: [], uniqueSkills: null,
    previousMinistryExperience: null, leadershipExperience: null, missionTripExperience: null,
    spiritualGifts: { topGifts: ["Teaching"] }, naturalStrengths: { selected: ["Teaching and explaining"] },
  });
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls++; throw new Error("Must not ask AI to infer unsupported assessments"); };
  try {
    for (const key of ["version", "bankVersion", "scoringVersion"] as const) {
      const result = await withOpenAiKey(() => findVolunteerMatches([{
        ...fixture, integratedAssessment: {
          ...versions, [key]: "unknown",
          constructs: [{ category: "Gift", construct: "Teaching", mean: 5, answeredCount: 3, eligible: true, evidence: "sufficient" }],
        },
      }], { roleDescription: "Teaching" }, 10));
      assert.deepEqual(result.candidates, [], key);
      assert.equal(result.usedAi, false);
    }
    assert.equal(networkCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});