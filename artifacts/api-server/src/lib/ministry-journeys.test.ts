import test from "node:test";
import assert from "node:assert/strict";
import {
  compareProfiles,
  adultIntegratedAnswerReview,
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
    journeyId: "journey-a",
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
    integratedAssessment: {
      version: "integrated-assessment-v1",
      answers: { private: 5 },
      snapshot: { questions: [{ text: "private prompt" }] },
    },
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
  assert.equal("integratedAssessment" in summary, false);
});

test("participant answer review is sanitized and preserves the original participant step order", () => {
  const profile = {
    ...adultProfile(13, "2025-05-01", [], []),
    integratedAssessment: {
      version: "integrated-assessment-v1",
      answers: { one: 5, two: 4, notApplicable: "na", skipped: "skip", optional: 3 },
      constructs: [{ construct: "must not leak", weight: 999 }],
      snapshot: {
        bankVersion: "internal-version",
        questions: [
          { id: "one", text: "First actual statement", responseModel: "reflectionLikert", maps: [{ category: "Strength", construct: "Listening", weight: 100 }] },
          { id: "two", text: "Second actual statement", responseModel: "reflectionLikert", maps: [{ category: "Strength", construct: "Listening", weight: 100 }] },
          { id: "notApplicable", text: "A not applicable statement", responseModel: "reflectionLikert", maps: [{ category: "APEST", construct: "Teacher", weight: 100 }] },
          { id: "skipped", text: "A skipped statement", responseModel: "reflectionLikert", maps: [{ category: "Gift", construct: "Mercy", weight: 100 }] },
          { id: "optional", text: "Optional experience statement", responseModel: "specialExperienceLikert", kind: "experience-evidence-unscored", maps: [] },
        ],
        responseModels: {
          reflectionLikert: { anchors: ["not", "little", "sometimes", "often", "very much"], scoring: "private" },
          specialExperienceLikert: { anchors: ["not", "little", "sometimes", "often", "very much"] },
        },
        assessmentConfiguration: { churchPrivateSetting: "not returned" },
      },
    },
    email: "private@example.com",
    journeyId: "journey-a",
  } as unknown as MinistryProfile;

  const review = adultIntegratedAnswerReview(profile);
  assert.deepEqual(review, {
    sections: [
      { label: "Reflections", questions: [
        { prompt: "First actual statement", response: "very much" },
        { prompt: "Second actual statement", response: "often" },
        { prompt: "A not applicable statement", response: "N/A — Not sure / I have not had the opportunity" },
        { prompt: "A skipped statement", response: "Skipped" },
      ] },
      { label: "Optional experiences", questions: [{ prompt: "Optional experience statement", response: "sometimes" }] },
    ],
    patterns: [{
      theme: "Listening",
      description: "A couple of reflections you rated highly connect with this theme.",
      statement: "First actual statement",
      responseLabel: "very much",
    }],
  });
  assert.deepEqual(Object.keys(review!.sections[0].questions[0]).sort(), ["prompt", "response"]);
  assert.equal(JSON.stringify(review).includes("internal-version"), false);
  assert.equal(JSON.stringify(review).includes("bankVersion"), false);
  assert.equal(JSON.stringify(review).includes("weight"), false);
  assert.equal(JSON.stringify(review).includes("churchPrivateSetting"), false);
  assert.equal(JSON.stringify(review).includes("private@example.com"), false);
});

test("answer review corrects the frozen EP-I-58 prompt and displays poles-based choices", () => {
  const profile = {
    ...adultProfile(17, "2025-05-01", [], []),
    integratedAssessment: {
      version: "integrated-assessment-v1",
      answers: { "EP-I-58": 4 },
      snapshot: {
        questions: [{
          id: "EP-I-58",
          text: "stale snapshot wording",
          responseModel: "personalityBipolar",
          poles: ["old first pole", "old second pole"],
          maps: [{ category: "Personality", construct: "Social Energy", weight: 1 }],
        }],
        responseModels: {
          personalityBipolar: { anchors: ["Definitely the first choice", "Usually the first choice", "Both equally / it depends", "Usually the second choice", "Definitely the second choice"] },
        },
      },
    },
  } as unknown as MinistryProfile;
  assert.deepEqual(adultIntegratedAnswerReview(profile)?.sections, [{
    label: "Reflections",
    questions: [{
      prompt: "After a busy week, which usually helps you recover your energy?",
      response: "Usually: Time with other people",
    }],
  }]);
});

test("answer review patterns require distinct supported core ratings and break ties deterministically", () => {
  const profile = {
    ...adultProfile(14, "2025-05-01", [], []),
    integratedAssessment: {
      version: "integrated-assessment-v1",
      answers: {
        b1: 4, b2: 5, a1: 4, a2: 5, c1: 5, onlyOne: 4,
        na1: "na", skip1: "skip", personality1: 5, optional1: 5,
      },
      snapshot: {
        questions: [
          { id: "b1", text: "B first", responseModel: "reflectionLikert", maps: [{ construct: "Beta" }] },
          { id: "b2", text: "B second", responseModel: "reflectionLikert", maps: [{ construct: "Beta" }] },
          { id: "a1", text: "A first", responseModel: "reflectionLikert", maps: [{ construct: "Alpha" }] },
          { id: "a2", text: "A second", responseModel: "reflectionLikert", maps: [{ construct: "Alpha" }] },
          { id: "c1", text: "C first", responseModel: "reflectionLikert", maps: [{ construct: "Charlie" }] },
          { id: "onlyOne", text: "One only", responseModel: "reflectionLikert", maps: [{ construct: "Unsupported" }] },
          { id: "na1", text: "N/A", responseModel: "reflectionLikert", maps: [{ construct: "No support" }] },
          { id: "skip1", text: "Skipped", responseModel: "reflectionLikert", maps: [{ construct: "No support" }] },
          { id: "personality1", text: "Bipolar", responseModel: "personalityBipolar", maps: [{ construct: "Personality" }] },
          { id: "optional1", text: "Optional", responseModel: "specialExperienceLikert", kind: "experience-evidence-unscored", maps: [{ construct: "Optional" }] },
        ],
        responseModels: {
          reflectionLikert: { anchors: ["1", "2", "3", "4 exact", "5 exact"] },
          personalityBipolar: { anchors: ["a", "b", "c", "d", "e"] },
          specialExperienceLikert: { anchors: ["a", "b", "c", "d", "e"] },
        },
      },
    },
  } as unknown as MinistryProfile;

  const review = adultIntegratedAnswerReview(profile);
  assert.deepEqual(review?.patterns.map(({ theme, statement, responseLabel }) => ({ theme, statement, responseLabel })), [
    { theme: "Alpha", statement: "A first", responseLabel: "4 exact" },
    { theme: "Beta", statement: "B first", responseLabel: "4 exact" },
  ]);
});

test("answer review is unavailable for youth and non-integrated profiles", () => {
  const youth = {
    ...adultProfile(15, "2025-05-01", [], []),
    profileType: "develop",
    integratedAssessment: { version: "integrated-assessment-v1", answers: {}, snapshot: {} },
  } as unknown as MinistryProfile;
  const legacyAdult = adultProfile(16, "2025-05-01", [], []);
  assert.equal(adultIntegratedAnswerReview(youth), null);
  assert.equal(adultIntegratedAnswerReview(legacyAdult), null);
});