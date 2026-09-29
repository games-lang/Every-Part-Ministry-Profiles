import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { defaultAssessmentConfiguration } from "./assessment-configuration.ts";
import { SUPPORTED_SPIRITUAL_GIFT_NAMES } from "./spiritual-gifts.ts";
import {
  answersError, constructKeys, createIntegratedSnapshot, INTEGRATED_BANK, integratedSignals,
  scoreIntegratedAssessment, type Answers, type Category,
} from "./integrated-assessment.ts";

const makeSnapshot = (overrides: Partial<Parameters<typeof createIntegratedSnapshot>[0]> = {}) => createIntegratedSnapshot({
  configuration: defaultAssessmentConfiguration(), customization: {},
  enabledGifts: [...SUPPORTED_SPIRITUAL_GIFT_NAMES],
  celibacyEligible: true, optionalExperienceOptIn: true, ...overrides,
}, new Date("2026-09-18T00:00:00Z"));
const seededRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x1_0000_0000;
};
const allAnswers = (value: 1 | 2 | 3 | 4 | 5 = 5): Answers =>
  Object.fromEntries(makeSnapshot().questions.map(q => [q.id, value]));

test("runtime bank preserves approved order, mappings and scoring with the corrected social-energy wording", () => {
  const source = JSON.parse(readFileSync(new URL("../../../../reports/final-integrated-question-bank.json", import.meta.url), "utf8"));
  const curatedPromptOverrides: Record<string, string> = {
    "EP-I-01": "I guide people in starting community service where none exists.",
    "EP-I-19": "I explain group activities in ways a newcomer can understand.",
    "EP-I-34": "I adapt designs to make useful objects.",
    "EP-I-58": "After a busy week, which usually helps you recover your energy?",
    "EP-I-61A": "When outcomes are uncertain, I trust God's care and encourage a next step.",
    "EP-I-68": "I notice immediate details or broader possibilities.",
    "EP-I-70": "I prefer supporting existing work or initiating new work.",
    "EP-I-78": "I prefer owning a task or working through it with others.",
  };
  assert.equal(INTEGRATED_BANK.coreQuestions.length, 79);
  assert.equal(INTEGRATED_BANK.optionalQuestions.length, 15);
  const curatedCoreIds = new Set(INTEGRATED_BANK.coreQuestions.map(q => q.id));
  assert.deepEqual(INTEGRATED_BANK.coreQuestions.map(q => q.id),
    source.stablePresentationOrder.filter((id: string) => curatedCoreIds.has(id)));
  assert.deepEqual(INTEGRATED_BANK.optionalQuestions.map(q => q.id), source.stableOptionalPresentationOrder);
  for (const question of INTEGRATED_BANK.coreQuestions) {
    const approved = source.coreQuestions.find((q: { id: string }) => q.id === question.id);
    assert.equal(question.text, curatedPromptOverrides[question.id] ?? approved.text);
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

test("fresh snapshots randomize construct-balanced ordering and keep bipolar questions in one block", () => {
  const input = {
    configuration: defaultAssessmentConfiguration(), customization: {},
    enabledGifts: [...SUPPORTED_SPIRITUAL_GIFT_NAMES],
    celibacyEligible: true, optionalExperienceOptIn: true,
  };
  const first = createIntegratedSnapshot(input, new Date("2026-09-18T00:00:00Z"), seededRandom(17));
  const second = createIntegratedSnapshot(input, new Date("2026-09-18T00:00:00Z"), seededRandom(93));
  const firstIds = first.questions.map(question => question.id);
  const secondIds = second.questions.map(question => question.id);
  assert.notDeepEqual(firstIds, secondIds, "independent fresh starts should receive different orderings");

  const activeCore = INTEGRATED_BANK.coreQuestions.filter(question => question.maps.some(map => {
    const { sectionKey, subsectionKey } = constructKeys(map.category as Category, map.construct);
    if (!input.configuration.sections[sectionKey]) return false;
    if (map.category === "Gift") {
      return (input.enabledGifts as string[]).includes(map.construct) && (map.construct !== "Celibacy" || input.celibacyEligible);
    }
    return !!input.configuration.subsections[subsectionKey as keyof typeof input.configuration.subsections];
  }));
  const expectedIds = [
    ...activeCore.map(question => question.id),
    ...INTEGRATED_BANK.optionalQuestions
      .filter(question => input.optionalExperienceOptIn && input.configuration.sections.spiritualGifts &&
        (input.enabledGifts as string[]).includes(question.construct))
      .map(question => question.id),
  ];
  assert.equal(firstIds.length, expectedIds.length);
  assert.equal(new Set(firstIds).size, firstIds.length);
  assert.deepEqual([...firstIds].sort(), [...expectedIds].sort(), "ordering must retain every bank question exactly once");

  const bipolarIndexes = first.questions.flatMap((question, index) =>
    question.responseModel === "personalityBipolar" ? [index] : []);
  const expectedBipolarCount = activeCore.filter(question => question.responseModel === "personalityBipolar").length;
  assert.equal(bipolarIndexes.length, 21);
  assert.equal(bipolarIndexes.length, expectedBipolarCount);
  const bipolarStart = bipolarIndexes[0];
  const bipolarEnd = bipolarIndexes.at(-1)!;
  assert.equal(bipolarEnd - bipolarStart + 1, bipolarIndexes.length, "all bipolar items form one contiguous block");
  assert.ok(bipolarStart > first.questions.length / 4 && bipolarEnd < first.questions.length * 3 / 4,
    "the bipolar block should sit near the middle of the attempt");
  for (const dimension of new Set(first.questions.flatMap(question =>
    question.maps.filter(map => map.category === "Personality").map(map => map.construct)))) {
    assert.ok(first.questions.filter(question => question.responseModel === "personalityBipolar" &&
      question.maps.some(map => map.category === "Personality" && map.construct === dimension)).length >= 2,
    `${dimension} must retain at least two bipolar questions`);
  }

  for (const half of [
    first.questions.slice(0, bipolarStart),
    first.questions.slice(bipolarEnd + 1).filter(question => question.maps.length > 0),
  ]) {
    const categories = new Set(half.flatMap(question =>
      question.maps.filter(map => map.category !== "Personality").map(map => map.category)));
    assert.deepEqual([...categories].sort(), ["APEST", "Gift", "Strength"],
      "both sides of the bipolar block should cover the non-personality categories");
    const constructs = new Set(half.flatMap(question =>
      question.maps.filter(map => map.category !== "Personality").map(map => `${map.category}:${map.construct}`)));
    assert.ok(constructs.size >= 10, "both sides should cover a broad range of constructs");
  }
});

test("all independent constructs survive, no top-N and no optional gift scores", () => {
  const result = scoreIntegratedAssessment(makeSnapshot(), allAnswers());
  assert.deepEqual(Object.fromEntries(["APEST", "Gift", "Strength", "Personality"].map(category => [
    category, result.constructs.filter(c => c.category === category).length,
  ])), { APEST: 5, Gift: 20, Strength: 18, Personality: 7 });
  assert.ok(result.constructs.every(construct => construct.eligible && construct.mean === 5));
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
  assert.equal(snapshot.questions.length, 76);
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
  const personality = result.constructs.filter(c => c.category === "Personality");
  assert.equal(personality.length, 7);
  assert.deepEqual(personality.filter(construct => construct.eligible).map(construct => construct.construct).sort(), [
    "Action Style", "Decision Lens", "Focus Style", "Pace Preference", "Planning Style", "Social Energy", "Work Style",
  ]);
  assert.ok(personality.every(construct => construct.eligible && construct.answeredCount >= 3 &&
    construct.mean === 1 && construct.tendency === construct.poles![0]));
  assert.ok(personality.every(construct => construct.eligible && construct.answeredCount >= 3));
  for (const q of snapshot.questions.filter(q => q.responseModel === "personalityBipolar")) answers[q.id] = 3;
  result = scoreIntegratedAssessment(snapshot, answers);
  assert.ok(result.constructs.filter(c => c.category === "Personality" && c.eligible)
    .every(c => c.mean === 3 && c.tendency === "Balanced / flexible"));
  assert.ok(result.constructs.filter(c => c.category === "Personality")
    .every(c => c.eligible && c.mean === 3 && c.tendency === "Balanced / flexible"));
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