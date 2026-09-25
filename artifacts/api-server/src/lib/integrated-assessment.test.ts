import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { defaultAssessmentConfiguration } from "./assessment-configuration.ts";
import { SUPPORTED_SPIRITUAL_GIFT_NAMES } from "./spiritual-gifts.ts";
import {
  answersError, createIntegratedSnapshot, INTEGRATED_BANK, integratedSignals,
  scoreIntegratedAssessment, type Answers,
} from "./integrated-assessment.ts";

const makeSnapshot = (overrides: Partial<Parameters<typeof createIntegratedSnapshot>[0]> = {}) => createIntegratedSnapshot({
  configuration: defaultAssessmentConfiguration(), customization: {},
  enabledGifts: [...SUPPORTED_SPIRITUAL_GIFT_NAMES],
  celibacyEligible: true, optionalExperienceOptIn: true, ...overrides,
}, new Date("2026-09-18T00:00:00Z"));
const allAnswers = (value: 1 | 2 | 3 | 4 | 5 = 5): Answers =>
  Object.fromEntries(makeSnapshot().questions.map(q => [q.id, value]));

test("runtime bank preserves approved order, mappings and scoring with the corrected social-energy wording", () => {
  const source = JSON.parse(readFileSync(new URL("../../../../reports/final-integrated-question-bank.json", import.meta.url), "utf8"));
  assert.equal(INTEGRATED_BANK.coreQuestions.length, 83);
  assert.equal(INTEGRATED_BANK.optionalQuestions.length, 15);
  assert.deepEqual(INTEGRATED_BANK.coreQuestions.map(q => q.id), source.stablePresentationOrder);
  assert.deepEqual(INTEGRATED_BANK.optionalQuestions.map(q => q.id), source.stableOptionalPresentationOrder);
  for (const question of INTEGRATED_BANK.coreQuestions) {
    const approved = source.coreQuestions.find((q: { id: string }) => q.id === question.id);
    assert.equal(question.text, question.id === "EP-I-58"
      ? "After a busy week, which usually helps you recover your energy?"
      : approved.text);
    assert.equal(question.responseModel, approved.responseModel);
    assert.deepEqual(question.maps, approved.maps.map(([category, construct, weight]: [string, string, number]) => ({
      category: category === "Spiritual Gift" ? "Gift" : category, construct, weight,
    })));
    if ("poles" in question) assert.deepEqual(question.poles, question.id === "EP-I-58"
      ? ["Quiet time by myself", "Time with other people"]
      : approved.poles);
  }
  for (const question of INTEGRATED_BANK.optionalQuestions) {
    const approved = source.optionalSpecialExperienceModule.items.find((q: { id: string }) => q.id === question.id);
    assert.equal(question.text, approved.text);
    assert.equal(question.construct, approved.construct);
    assert.equal(question.kind, approved.kind);
    assert.deepEqual(question.maps, []);
  }
  assert.equal(INTEGRATED_BANK.coreQuestions.filter(q => q.responseModel === "personalityBipolar").length, 21);
  assert.throws(() => { INTEGRATED_BANK.coreQuestions[0].text = "changed"; }, TypeError);
});

test("all independent constructs survive, no top-N and no optional gift scores", () => {
  const result = scoreIntegratedAssessment(makeSnapshot(), allAnswers());
  assert.deepEqual(Object.fromEntries(["APEST", "Gift", "Strength", "Personality"].map(category => [
    category, result.constructs.filter(c => c.category === category).length,
  ])), { APEST: 5, Gift: 20, Strength: 18, Personality: 7 });
  assert.ok(result.constructs.every(c => c.eligible && c.mean === 5));
  assert.equal(result.optionalExperiences.length, 15);
  assert.deepEqual(result.conversationOnlyGifts, ["Discernment of Spirits"]);
  for (const gift of ["Prophecy", "Healing", "Tongues", "Miracles", "Interpretation of Tongues", "Discernment of Spirits"]) {
    assert.ok(!result.constructs.some(c => c.category === "Gift" && c.construct === gift));
    assert.ok(!integratedSignals(result)!.spiritualGifts.includes(gift));
  }
  assert.equal(integratedSignals(result)!.strengths.length, 18);
});

test("weighted means count distinct actual answers and exclude na/skip/missing", () => {
  const snapshot = makeSnapshot();
  const construct = "Administration";
  const questions = snapshot.questions.filter(q => q.maps.some(m => m.category === "Gift" && m.construct === construct));
  const weighted = questions.find(q => q.maps.some(m => m.construct === construct && m.weight === .5))!;
  const primary = questions.filter(q => q.maps.some(m => m.construct === construct && m.weight === 1)).slice(0, 2);
  const answers: Answers = { [weighted.id]: 1, [primary[0].id]: 4, [primary[1].id]: 5 };
  for (const q of questions.filter(q => !(q.id in answers))) answers[q.id] = "na";
  let score = scoreIntegratedAssessment(snapshot, answers).constructs.find(c => c.category === "Gift" && c.construct === construct)!;
  assert.equal(score.mean, 9.5 / 2.5);
  assert.equal(score.answeredCount, 3);
  assert.equal(score.answeredWeight, 2.5);
  answers[weighted.id] = "skip";
  score = scoreIntegratedAssessment(snapshot, answers).constructs.find(c => c.category === "Gift" && c.construct === construct)!;
  assert.equal(score.eligible, false);
  assert.equal(score.mean, null);
  assert.equal(score.answeredCount, 2);
});

test("shared items retain active links but never produce disabled hidden scores", () => {
  const configuration = defaultAssessmentConfiguration();
  configuration.sections.spiritualGifts = false;
  configuration.subsections["apest.builder"] = false;
  const snapshot = makeSnapshot({ configuration });
  const shared = snapshot.questions.find(q => q.id === "EP-I-01")!;
  assert.deepEqual(shared.maps.map(m => m.category), ["Strength"]);
  const result = scoreIntegratedAssessment(snapshot, Object.fromEntries(snapshot.questions.map(q => [q.id, 5])) as Answers);
  assert.equal(result.optionalExperiences.length, 0);
  assert.equal(result.constructs.filter(c => c.category === "Gift").length, 0);
  assert.ok(!result.constructs.some(c => c.category === "APEST" && c.construct === "Apostle"));
});

test("gift toggles, opt-in and participant Celibacy eligibility independently filter questions", () => {
  const snapshot = makeSnapshot({ celibacyEligible: false, optionalExperienceOptIn: false });
  assert.equal(snapshot.questions.length, 80);
  assert.ok(!snapshot.questions.some(q => q.maps.some(m => m.construct === "Celibacy")));
  const onlyProphecy = makeSnapshot({ enabledGifts: ["Prophecy"] });
  assert.deepEqual(onlyProphecy.questions.filter(q => !q.maps.length).map(q => q.construct), ["Prophecy", "Prophecy", "Prophecy"]);
  const configuration = defaultAssessmentConfiguration();
  for (const section of ["apest", "naturalStrengths", "personalityStrengths"] as const) configuration.sections[section] = false;
  const giftOnly = makeSnapshot({ configuration, enabledGifts: ["Healing"], optionalExperienceOptIn: false });
  assert.equal(giftOnly.questions.length, 0);
});

test("personality uses only its original bipolar responses with neutral midpoints", () => {
  const snapshot = makeSnapshot();
  const answers: Answers = Object.fromEntries(snapshot.questions.map(q => [q.id, q.responseModel === "personalityBipolar" ? 1 : 5]));
  let result = scoreIntegratedAssessment(snapshot, answers);
  assert.ok(result.constructs.filter(c => c.category === "Personality").every(c => c.mean === 1 && c.tendency === c.poles![0]));
  for (const q of snapshot.questions.filter(q => q.responseModel === "personalityBipolar")) answers[q.id] = 3;
  result = scoreIntegratedAssessment(snapshot, answers);
  assert.ok(result.constructs.filter(c => c.category === "Personality").every(c => c.mean === 3 && c.tendency === "Balanced / flexible"));
  for (const q of snapshot.questions.filter(q => q.responseModel === "personalityBipolar")) delete answers[q.id];
  assert.ok(scoreIntegratedAssessment(snapshot, answers).constructs.filter(c => c.category === "Personality").every(c => c.mean === null));
});

test("snapshot is independent of mutable church configuration and runtime edits", () => {
  const configuration = defaultAssessmentConfiguration();
  const snapshot = makeSnapshot({ configuration });
  configuration.sections.apest = false;
  assert.equal(snapshot.assessmentConfiguration.sections.apest, true);
  snapshot.questions[0].text = "local test copy";
  assert.notEqual(INTEGRATED_BANK.coreQuestions[0].text, "local test copy");
});

test("invalid IDs, choices and incomplete core reject, explicit skipped core permits completion", () => {
  const snapshot = makeSnapshot();
  assert.ok(answersError({ madeUp: 5 }, snapshot));
  assert.ok(answersError({ [snapshot.questions[0].id]: 0 }, snapshot));
  assert.ok(answersError({ [snapshot.questions[0].id]: 1.5 }, snapshot));
  assert.ok(answersError({ [snapshot.questions[0].id]: { score: 5 } }, snapshot));
  assert.ok(answersError({}, snapshot, true));
  const skipped: Answers = Object.fromEntries(snapshot.questions.filter(q => q.maps.length).map(q => [q.id, "skip"]));
  assert.equal(answersError(skipped, snapshot, true), null);
  assert.ok(scoreIntegratedAssessment(snapshot, skipped).constructs.every(c => !c.eligible));
  assert.deepEqual(integratedSignals(scoreIntegratedAssessment(snapshot, allAnswers(1)))!.spiritualGifts, []);
  assert.throws(() => scoreIntegratedAssessment({ ...snapshot, scoringVersion: "unknown-future-version" }, skipped), /not supported/);
});

test("only absent integrated envelopes permit legacy fallback; every unsupported version fails closed", () => {
  const result = scoreIntegratedAssessment(makeSnapshot(), allAnswers());
  const empty = { ministryTendencies: [], spiritualGifts: [], strengths: [], personalityTendencies: [] };
  assert.equal(integratedSignals(null), null);
  assert.equal(integratedSignals(undefined), null);
  assert.ok(integratedSignals(result)!.spiritualGifts.length > 0);
  for (const key of ["version", "bankVersion", "scoringVersion"] as const) {
    assert.deepEqual(integratedSignals({ ...result, [key]: "unsupported-version" }), empty, key);
    assert.deepEqual(integratedSignals({ ...result, [key]: undefined }), empty, `missing ${key}`);
  }
  for (const malformed of [{}, false, "", [], 0]) assert.deepEqual(integratedSignals(malformed), empty);
});