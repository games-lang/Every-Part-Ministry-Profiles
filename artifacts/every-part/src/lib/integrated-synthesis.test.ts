import assert from "node:assert/strict";
import test from "node:test";
import { getMyMinistrySynthesis, scoreMinistryTendencies } from "./my-profile-derivation";
import { getLeaderSynthesis } from "./leader-derivation";
import { derivedPersonality, PERSONALITY_DIMENSIONS } from "../pages/profile-detail";

const yes = () => true;
const base = {
  memberName: "Test Participant", age: 30, completedAt: "2026-01-01T00:00:00Z",
  basicInformation: {}, churchConnection: {}, skills: {}, passions: [], interests: [],
  availability: [], servingFrequency: "", assessmentConfiguration: { sections: {}, subsections: {} },
  assessmentSections: {
    apest: { primary: "Teacher", secondary: "Shepherd" },
    naturalStrengths: { selected: ["Organizing"] },
    spiritualGifts: { topGifts: ["Healing", "Prophecy", "Mercy", "Faith"] },
    personalityStrengths: { responses: { "socialEnergy-0": 5, "socialEnergy-1": 5, "socialEnergy-2": 5 } },
  },
};
type Profile = Parameters<typeof getMyMinistrySynthesis>[0];
const item = (category: string, construct: string, mean: number | null) => ({
  category, construct, mean, answeredCount: mean === null ? 0 : 3,
  eligible: mean !== null, evidence: mean === null ? "insufficient" : "sufficient",
});
const envelope = (constructs: unknown[]) => ({
  version: "integrated-assessment-v1", bankVersion: "adult-integrated-83-v1", scoringVersion: "independent-weighted-mean-v1",
  snapshot: { enabledSpiritualGifts: ["Mercy", "Faith"] }, constructs, optionalExperiences: [],
});

test("participant and leader integrated synthesis use the unchanged Serving Pattern calculation", () => {
  const means = [1, 2, 5, 2, 1, 2, 5];
  const integratedAssessment = envelope([
    ...PERSONALITY_DIMENSIONS.map(([, label], index) => item("Personality", label, means[index])),
    item("Strength", "Listening", 4), item("Strength", "Organizing", 4),
    item("Strength", "Hospitality", 1),
    item("APEST", "Shepherd", 4), item("Gift", "Mercy", 4),
  ]);
  const profile = { ...base, integratedAssessment } as unknown as Profile;
  // Reference the existing legacy model for exactly equivalent, complete means.
  // This is a test oracle only; the production adapter never creates responses.
  const responses = Object.fromEntries(PERSONALITY_DIMENSIONS.flatMap(([key], index) =>
    [0, 1, 2].map(question => [`${key}-${question}`, means[index]])));
  const expected = scoreMinistryTendencies(derivedPersonality(responses, yes), ["Listening", "Organizing"]);
  const participant = getMyMinistrySynthesis(profile, yes, yes);
  const leader = getLeaderSynthesis(profile, yes, yes);
  assert.deepEqual(participant.ministryTendency?.scoring, expected);
  assert.deepEqual(leader.participantSynthesis.ministryTendency, participant.ministryTendency);
  assert.deepEqual(participant.topGifts, ["Mercy"]);
  assert.equal(participant.apestResult?.label, "Shepherd");
  assert.deepEqual(participant.selectedStrengths, ["Listening", "Organizing"]);
});

test("integrated insufficient evidence cannot resurrect conflicting legacy scores or Serving Pattern", () => {
  const profile = { ...base, integratedAssessment: envelope([
    item("APEST", "Shepherd", null), item("Personality", "Social Energy", null), item("Strength", "Listening", null),
  ]) } as unknown as Profile;
  const result = getMyMinistrySynthesis(profile, yes, yes);
  assert.equal(result.apestResult, null);
  assert.equal(result.ministryTendency, null);
  assert.deepEqual(result.topGifts, []);
  assert.deepEqual(result.selectedStrengths, []);
  assert.deepEqual(result.personalityLeanings, []);
});

test("current season shows each availability answer with its own label", () => {
  const profile = {
    ...base,
    availability: ["Weekday evenings"],
    availabilityDetails: {
      seasonal: "Flexible/varies",
      specialEvents: "Yes",
      retreats: "Maybe / discuss",
    },
  } as unknown as Profile;
  const season = getMyMinistrySynthesis(profile, yes, yes).season;
  assert.match(season, /Availability windows: Weekday evenings/);
  assert.match(season, /Seasonal availability: Flexible\/varies/);
  assert.match(season, /Special events: Yes/);
  assert.match(season, /Retreats: Maybe \/ discuss/);
  assert.doesNotMatch(season, /Yes; Maybe \/ discuss/);
});

test("legacy summaries remain unchanged before and after consuming integrated history", () => {
  const profile = structuredClone(base) as unknown as Profile;
  const before = getMyMinistrySynthesis(profile, yes, yes);
  getMyMinistrySynthesis({ ...base, integratedAssessment: envelope([item("APEST", "Apostle", 5)]) } as unknown as Profile, yes, yes);
  const after = getMyMinistrySynthesis(profile, yes, yes);
  assert.deepEqual(after, before);
  assert.equal(after.integrated, null);
  assert.equal(after.apestResult?.label, "Teacher");
  assert.deepEqual(after.topGifts, ["Healing", "Prophecy", "Mercy"]);
  assert.deepEqual(profile, base);
});

test("canonical balanced spectra do not become directional personality prose or narrative patterns", () => {
  for (const mean of [2.5, 8 / 3, 3, 10 / 3, 3.5]) {
    const profile = { ...base, integratedAssessment: envelope(
      PERSONALITY_DIMENSIONS.map(([, label]) => item("Personality", label, mean)),
    ) } as unknown as Profile;
    const participant = getMyMinistrySynthesis(profile, yes, yes);
    assert.equal(participant.personalityLeanings.length, 7);
    assert.ok(participant.personalityLeanings.every(dimension =>
      dimension.leaning === "Balanced" && dimension.tendency === "Balanced / flexible"));
    assert.deepEqual(participant.patterns, []);
    // Neutral-band labeling does not change the original numerical calculation.
    const responses = Object.fromEntries(PERSONALITY_DIMENSIONS.flatMap(([key]) =>
      [0, 1, 2].map(question => [`${key}-${question}`, mean])));
    assert.deepEqual(participant.ministryTendency?.scoring, scoreMinistryTendencies(derivedPersonality(responses, yes), []));
  }
});

test("unsupported bank cannot recover a legacy orientation or a Serving Pattern", () => {
  const integratedAssessment = {
    ...envelope([item("APEST", "Apostle", 5), item("Personality", "Social Energy", 5)]),
    bankVersion: "adult-integrated-future",
  };
  const result = getMyMinistrySynthesis({ ...base, integratedAssessment } as unknown as Profile, yes, yes);
  assert.equal(result.integrated?.valid, false);
  assert.equal(result.apestResult, null);
  assert.equal(result.ministryTendency, null);
  assert.deepEqual(result.personalityLeanings, []);
  assert.deepEqual(result.topGifts, []);
});