import assert from "node:assert/strict";
import test from "node:test";
import { integratedPersonality, integratedResults, INSUFFICIENT_EVIDENCE } from "./integrated-results.ts";

const yes = () => true;
const gifts = ["Administration", "Giving", "Faith", "Hospitality", "Mercy", "Teaching", "Healing", "Miracles", "Tongues", "Interpretation of Tongues", "Prophecy", "Discernment of Spirits"];
const construct = (category: string, name: string, mean: number | null = 4, answeredCount = 3) => ({
  category, construct: name, mean, answeredCount, availableCount: 4,
  eligible: mean !== null, evidence: mean !== null ? "sufficient" : "insufficient",
});
const fixture = (constructs: unknown[] = []) => ({
  assessmentConfiguration: { sections: {}, subsections: {} },
  assessmentSections: { apest: { primary: "Apostle" }, spiritualGifts: { topGifts: ["Healing"] } },
  integratedAssessment: {
    version: "integrated-assessment-v1",
    bankVersion: "adult-integrated-83-v1",
    scoringVersion: "independent-weighted-mean-v1",
    snapshot: {
      enabledSpiritualGifts: gifts,
      assessmentConfiguration: { sections: {}, subsections: {} },
    },
    constructs,
    optionalExperiences: [] as unknown[],
    conversationOnlyGifts: [] as string[],
  },
});

test("legacy histories remain outside the integrated adapter, regardless of raw responses", () => {
  const legacy = { assessmentSections: { apest: { responses: { "builder-0": 5 } }, spiritualGifts: { topGifts: ["Healing", "Prophecy"] } } };
  const before = structuredClone(legacy);
  assert.equal(integratedResults(legacy, yes, yes), null);
  assert.equal(integratedResults({ ...legacy, integratedAssessment: null }, yes, yes), null);
  assert.deepEqual(legacy, before);
});

test("reads canonical independent means; does not re-score or truncate gift results", () => {
  const profile = fixture(gifts.slice(0, 6).map((gift, i) => construct("Gift", gift, 1 + i * .7)));
  const before = structuredClone(profile);
  const result = integratedResults(profile, yes, yes)!;
  assert.equal(result.scored("Gift").length, 6);
  assert.deepEqual(result.forCategory("Gift").map(item => item.mean), [1, 1.7, 2.4, 3.0999999999999996, 3.8, 4.5]);
  assert.deepEqual(profile, before);
});

test("insufficient, N/A and missing evidence never become zero, midpoint, or a legacy result", () => {
  const result = integratedResults(fixture([
    construct("APEST", "Teacher", null, 2),
    construct("Gift", "Mercy", 5, 2),
    construct("Personality", "Social Energy", null, 0),
  ]), yes, yes)!;
  assert.equal(INSUFFICIENT_EVIDENCE, "Not enough information yet");
  assert.equal(result.forCategory("APEST")[0].mean, null);
  assert.equal(result.forCategory("Gift")[0].mean, null);
  assert.deepEqual(result.signals("APEST"), []);
  assert.deepEqual(result.signals("Gift"), []);
  assert.deepEqual(integratedPersonality(result, []), []);
});

test("requires server eligibility, sufficient evidence and bounded finite means together", () => {
  const cases = [
    { ...construct("Gift", "Mercy"), eligible: false },
    { ...construct("Gift", "Mercy"), evidence: "insufficient" },
    construct("Gift", "Mercy", Number.NaN),
    construct("Gift", "Mercy", 6),
    construct("Gift", "Mercy", 0),
  ];
  for (const item of cases) assert.equal(integratedResults(fixture([item]), yes, yes)!.scored("Gift").length, 0);
});

test("four categories stay separate even when the same label appears in different categories", () => {
  const result = integratedResults(fixture([
    construct("APEST", "Teacher"), construct("Gift", "Teaching"),
    construct("Strength", "Hospitality", 2), construct("Gift", "Hospitality", 4.5),
    construct("Personality", "Work Style", 3),
  ]), yes, yes)!;
  assert.equal(result.forCategory("Strength")[0].mean, 2);
  assert.equal(result.forCategory("Gift").find(item => item.construct === "Hospitality")!.mean, 4.5);
  assert.equal(result.forCategory("APEST").length, 1);
  assert.equal(result.forCategory("Personality").length, 1);
});

test("optional five and Discernment are never scored and private answers do not enter adapter output", () => {
  const names = gifts.slice(6);
  const profile = fixture(names.map(name => construct("Gift", name, 5, 10)));
  profile.integratedAssessment.optionalExperiences = names.slice(0, 5).map(construct => ({
    construct, kind: "experience", answer: "PRIVATE OPTIONAL NOTE", text: "PRIVATE PROMPT",
  }));
  profile.integratedAssessment.conversationOnlyGifts = ["Discernment of Spirits"];
  const result = integratedResults(profile, yes, yes)!;
  assert.deepEqual(result.scored("Gift"), []);
  assert.deepEqual(result.conversations, names);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE/);
});

test("saved and frozen section/subsection switches gate results even with permissive callers", () => {
  const profile = fixture([construct("APEST", "Teacher"), construct("Strength", "Listening"), construct("Gift", "Mercy")]);
  profile.assessmentConfiguration.sections = { apest: false };
  profile.integratedAssessment.snapshot.assessmentConfiguration.subsections = { "naturalStrengths.listening": false };
  profile.integratedAssessment.snapshot.enabledSpiritualGifts = ["Giving"];
  assert.deepEqual(integratedResults(profile, yes, yes)!.constructs, []);
});

test("caller gates still apply and disabled optional areas disappear", () => {
  const profile = fixture([construct("APEST", "Teacher"), construct("Strength", "Listening")]);
  profile.integratedAssessment.optionalExperiences = [{ construct: "Healing" }];
  const result = integratedResults(profile, section => section !== "spiritualGifts", (section, key) => !(section === "apest" && key === "teacher"))!;
  assert.equal(result.forCategory("APEST").length, 0);
  assert.equal(result.forCategory("Strength").length, 1);
  assert.deepEqual(result.conversations, []);
});

test("unknown integrated versions fail closed, never reinterpreted as legacy histories", () => {
  for (const key of ["version", "bankVersion", "scoringVersion"] as const) {
    const profile = fixture([construct("APEST", "Apostle")]);
    profile.integratedAssessment[key] = "future-version";
    profile.integratedAssessment.optionalExperiences = [{ construct: "Healing" }];
    const result = integratedResults(profile, yes, yes)!;
    assert.equal(result.valid, false, key);
    assert.deepEqual(result.constructs, [], key);
    assert.deepEqual(result.signals("APEST"), [], key);
    assert.deepEqual(result.conversations, [], key);
  }
});

test("positive synthesis signals match server threshold without suppressing low reflection means", () => {
  const result = integratedResults(fixture([
    construct("Strength", "Listening", 3.49), construct("Strength", "Organizing", 3.5),
  ]), yes, yes)!;
  assert.equal(result.scored("Strength").length, 2);
  assert.deepEqual(result.signals("Strength").map(item => item.construct), ["Organizing"]);
});

test("personality means directly feed the original seven-spectrum model with correct polarity", () => {
  const definitions = [
    ["socialEnergy", "Social Energy", "Reflective", "Interactive", "left explanation", "right explanation", "reflective", "interactive", "connection"],
    ["workStyle", "Work Style", "Independent", "Collaborative", "left explanation", "right explanation", "independent", "collaborative", "teamwork"],
  ] as const;
  for (const [mean, expected, dominant] of [[1, 0, "left"], [3, 50, "balanced"], [5, 100, "right"]] as const) {
    const result = integratedResults(fixture([
      { ...construct("Personality", "Social Energy", mean), poles: ["Reflective", "Interactive"] },
      construct("Personality", "Work Style", null, 1),
    ]), yes, yes)!;
    const dimensions = integratedPersonality(result, definitions);
    assert.equal(dimensions.length, 1);
    assert.equal(dimensions[0].rightPercentage, expected);
    assert.equal(dimensions[0].dominant, dominant);
  }
});

test("canonical neutral band governs personality dominance, tendency and explanation, not rounded percentages", () => {
  const definitions = [
    ["socialEnergy", "Social Energy", "Reflective", "Interactive", "left explanation", "right explanation", "reflective", "interactive", "connection"],
  ] as const;
  for (const mean of [2.5, 8 / 3, 3, 10 / 3, 3.5]) {
    const result = integratedResults(fixture([construct("Personality", "Social Energy", mean)]), yes, yes)!;
    const [dimension] = integratedPersonality(result, definitions);
    assert.equal(dimension.dominant, "balanced", String(mean));
    assert.equal(dimension.tendency, "Balanced / flexible", String(mean));
    assert.match(dimension.explanation, /draw from both reflective and interactive/, String(mean));
    assert.equal(dimension.rightPercentage, Math.round((mean - 1) / 4 * 100));
    assert.equal(dimension.leftPercentage, 100 - dimension.rightPercentage);
  }
  for (const [mean, dominant, tendency, explanation] of [
    [2.499, "left", "Reflective", "left explanation"],
    [3.501, "right", "Interactive", "right explanation"],
  ] as const) {
    const result = integratedResults(fixture([construct("Personality", "Social Energy", mean)]), yes, yes)!;
    const [dimension] = integratedPersonality(result, definitions);
    assert.equal(dimension.dominant, dominant);
    assert.equal(dimension.tendency, tendency);
    assert.equal(dimension.explanation, explanation);
  }
});