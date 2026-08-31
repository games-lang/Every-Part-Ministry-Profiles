import assert from "node:assert/strict";
import test from "node:test";
import {
  adultProfilesOnly,
  discoverSubmissionSchema,
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

test("adultProfilesOnly excludes every youth pathway", () => {
  assert.deepEqual(adultProfilesOnly([
    { profileType: "adult", id: 1 },
    { profileType: "discover", id: 2 },
    { profileType: "explore", id: 3 },
    { profileType: "develop", id: 4 },
  ]).map((profile) => profile.id), [1]);
});