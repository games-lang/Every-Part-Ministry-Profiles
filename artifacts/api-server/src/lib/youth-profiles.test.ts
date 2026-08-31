import assert from "node:assert/strict";
import test from "node:test";
import {
  adultProfilesOnly,
  discoverSubmissionSchema,
  DEVELOP_COMPLETION_COPY,
  developResultSummary,
  developSubmissionSchema,
  EXPLORE_COMPLETION_COPY,
  exploreResultSummary,
  exploreSubmissionSchema,
  pathwayForAge,
  pathwayOverrideRequired,
  youthResultSummary,
} from "./youth-profiles.ts";

const valid = {
  churchSlug: "grace",
  age: 7,
  profileType: "discover",
  child: { firstName: "Sam", lastName: "Lee" },
  guardian: { name: "Pat Lee", email: "pat@example.com", consent: true },
  answers: {
    aboutMe: { likes: ["Drawing"], goodAt: "Listening", wantToLearn: "Music" },
    tendencies: { peopleEnergy: "love", newThings: "sometimes", helpingResponse: "ask-first", enjoys: ["Building"] },
    caresAbout: ["Friends"],
    waysToHelp: ["Welcome"],
    growingWithJesus: { interests: ["Stories"] },
    opportunities: { welcome: "love" },
  },
} as const;

const exploreValid = {
  churchSlug: "grace",
  age: 10,
  birthdate: "2015-04-10",
  profileType: "explore",
  child: { firstName: "Alex", lastName: "Lee" },
  guardian: { name: "Pat Lee", email: "pat@example.com", consent: true },
  answers: {
    aboutMe: { likes: ["Drawing", "Music"], goodAt: "Listening", wantToLearn: "Video editing" },
    howITendToOperate: {
      peopleEnergy: "being-with-people",
      decisionStyle: "talk-it-out",
      planningStyle: "plan-ahead",
      focusStyle: "notice-details",
      actionStyle: "jump-in",
    },
    peopleAndNeeds: ["New kids"],
    waysIEnjoyHelping: ["Using technology", "Making people feel welcome"],
    growingWithJesus: { interests: ["Prayer", "Music"] },
    opportunities: { welcome: "love", creative: "love", worship: "maybe", production: "maybe" },
  },
  guardianObservations: { strengths: "Thoughtful", thriveNotes: "Enjoys a calm introduction" },
} as const;

const developValid = {
  churchSlug: "grace",
  age: 15,
  birthdate: "2010-04-10",
  profileType: "develop",
  child: { firstName: "Jordan", lastName: "Lee" },
  guardian: { name: "Pat Lee", email: "pat@example.com", consent: true },
  answers: {
    prayerAndCalling: { reflection: "I am praying about how to use my creativity." },
    aboutMe: { likes: ["Creating", "Learning"], goodAt: "Explaining ideas", wantToLearn: "Sound and video" },
    howITendToOperate: {
      peopleEnergy: "mix-of-both",
      processingStyle: "learn-by-doing",
      planningStyle: "adapt-as-you-go",
      peopleLogic: "people-first",
      actionReflection: "move-between-both",
      leadershipSupport: "share-leadership",
      conflictStyle: "listen-and-find-common-ground",
      teamPreference: "variety-of-people",
    },
    giftsToExplore: { interests: ["Creativity", "Encouragement"], reflection: "I like helping people feel seen." },
    passions: { peopleAndCauses: ["Newcomers", "Community"], reflection: "I want people to feel included." },
    growingWithJesus: { interests: ["Prayer", "Asking honest questions"] },
    callingAndPurpose: { whatMatters: "People feeling included", futureHope: "I hope to encourage others." },
    ministryInterests: { creative: "love", welcome: "maybe", production: "maybe" },
    availabilityAndResponsibility: { availability: "monthly", responsibilityStyle: "start-small" },
    developmentPlan: { nextSteps: ["conversation", "shadow"], goal: "Talk with a leader about trying tech." },
  },
} as const;

test("pathwayForAge has safe boundaries", () => {
  assert.equal(pathwayForAge(6), "discover");
  assert.equal(pathwayForAge(9), "explore");
  assert.equal(pathwayForAge(13), "develop");
  assert.equal(pathwayForAge(18), "adult");
  assert.throws(() => pathwayForAge(5));
  assert.throws(() => pathwayForAge(121));
});

test("only mismatched pathways require authorized override", () => {
  assert.equal(pathwayOverrideRequired("discover", "discover"), false);
  assert.equal(pathwayOverrideRequired("discover", "explore"), true);
  assert.equal(pathwayOverrideRequired("adult", "adult"), false);
});

test("Discover payload rejects unknown keys and missing guardian consent", () => {
  assert.equal(discoverSubmissionSchema.safeParse(valid).success, true);
  assert.equal(discoverSubmissionSchema.safeParse({
    ...valid, answers: { ...valid.answers, opportunities: { invented: "love" } },
  }).success, false);
  assert.equal(discoverSubmissionSchema.safeParse({
    ...valid, guardian: { ...valid.guardian, consent: false },
  }).success, false);
});

test("Youth summary uses tentative language", () => {
  const parsed = discoverSubmissionSchema.parse(valid);
  const summary = youthResultSummary(parsed.answers);
  assert.match(summary.tentativeNote, /ideas to explore/i);
  assert.match(summary.nextStep, /still growing.*starting point for conversation, prayer, serving, and learning/i);
});

test("Explore payload enforces ages, consent, and server-owned opportunities", () => {
  assert.equal(exploreSubmissionSchema.safeParse(exploreValid).success, true);
  assert.equal(exploreSubmissionSchema.safeParse({ ...exploreValid, age: 8 }).success, false);
  assert.equal(exploreSubmissionSchema.safeParse({ ...exploreValid, age: 13 }).success, false);
  assert.equal(exploreSubmissionSchema.safeParse({
    ...exploreValid,
    guardian: { ...exploreValid.guardian, consent: false },
  }).success, false);
  assert.equal(exploreSubmissionSchema.safeParse({
    ...exploreValid,
    answers: { ...exploreValid.answers, opportunities: { invented: "love", welcome: "love" } },
  }).success, false);
  assert.equal(exploreSubmissionSchema.safeParse({
    ...exploreValid,
    answers: { ...exploreValid.answers, peopleAndNeeds: [] },
  }).success, false);
  assert.equal(exploreSubmissionSchema.safeParse({
    ...exploreValid,
    unexpected: true,
  }).success, false);
  assert.equal(exploreSubmissionSchema.safeParse({
    ...exploreValid,
    guardianObservations: { strengths: "Thoughtful", unexpected: "no" },
  }).success, false);
  assert.equal(exploreSubmissionSchema.parse(exploreValid).birthdate, "2015-04-10");
  assert.equal(exploreSubmissionSchema.safeParse({
    ...exploreValid,
    answers: { ...exploreValid.answers, caresAbout: ["not part of Explore"] },
  }).success, false);
  assert.equal(exploreSubmissionSchema.safeParse({
    ...exploreValid,
    answers: { ...exploreValid.answers, opportunities: { students: "love", welcome: "love" } },
  }).success, false);
  assert.equal(exploreSubmissionSchema.safeParse({
    ...exploreValid,
    answers: { ...exploreValid.answers, howITendToOperate: { ...exploreValid.answers.howITendToOperate, reflection: " " } },
  }).success, false);
});

test("Explore summary gives deterministic tentative 2–4 suggestions", () => {
  const answers = exploreSubmissionSchema.parse(exploreValid).answers;
  const first = exploreResultSummary(answers);
  const second = exploreResultSummary(answers);
  assert.deepEqual(first, second);
  assert.equal(first.suggestions.length, 4);
  assert.deepEqual(first.suggestions.map((suggestion) => suggestion.opportunityKey), [
    "welcome", "worship", "production", "creative",
  ]);
  assert.match(first.suggestions[2].reason, /Using technology.*marked Tech as maybe/i);
  assert.match(first.suggestions[1].reason, /Music.*marked Worship \/ music as maybe/i);
  assert.equal(first.completionCopy, EXPLORE_COMPLETION_COPY);
  assert.match(first.completionCopy, /not a permanent label\.$/);
  assert.ok(first.suggestions.every((suggestion) => !/should serve/i.test(suggestion.reason)));
  assert.match(first.tendencySummary, /energized by being with people|clear plan|details/i);
  assert.doesNotMatch(first.tendencySummary, /\b(MBTI|score|type|label|percentage)\b/i);
});

test("Develop payload enforces teen ages, consent, and server-owned opportunities", () => {
  assert.equal(developSubmissionSchema.safeParse(developValid).success, true);
  assert.equal(developSubmissionSchema.safeParse({ ...developValid, age: 12 }).success, false);
  assert.equal(developSubmissionSchema.safeParse({ ...developValid, age: 18 }).success, false);
  assert.equal(developSubmissionSchema.safeParse({
    ...developValid,
    guardian: { ...developValid.guardian, consent: false },
  }).success, false);
  assert.equal(developSubmissionSchema.safeParse({
    ...developValid,
    answers: { ...developValid.answers, ministryInterests: { invented: "love", creative: "love" } },
  }).success, false);
  assert.equal(developSubmissionSchema.safeParse({
    ...developValid,
    answers: { ...developValid.answers, howITendToOperate: { ...developValid.answers.howITendToOperate, conflictStyle: "avoid-everything" } },
  }).success, false);
  assert.equal(developSubmissionSchema.safeParse({
    ...developValid,
    answers: { ...developValid.answers, ministryInterests: { creative: "not-now" } },
  }).success, false);
});

test("Develop summary stays tentative and includes the teen's plan", () => {
  const parsed = developSubmissionSchema.parse(developValid);
  const summary = developResultSummary(parsed.answers);
  assert.equal(summary.developmentPlan.goal, "Talk with a leader about trying tech.");
  assert.deepEqual(summary.ministryInterests.map((item) => item.opportunityKey), ["welcome", "production", "creative"]);
  assert.equal(summary.completionCopy, DEVELOP_COMPLETION_COPY);
  assert.match(summary.tendencySummary, /may|you may/i);
  assert.doesNotMatch(summary.tendencySummary, /\b(MBTI|type|score|label|percentage)\b/i);
  assert.match(summary.callingSummary, /included|encourage/i);
});

test("adultProfilesOnly excludes every youth pathway", () => {
  assert.deepEqual(adultProfilesOnly([
    { profileType: "adult", id: 1 },
    { profileType: "discover", id: 2 },
    { profileType: "explore", id: 3 },
    { profileType: "develop", id: 4 },
  ]).map((profile) => profile.id), [1]);
});