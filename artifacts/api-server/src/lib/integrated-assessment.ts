import bankJson from "./integrated-bank.json" with { type: "json" };
import { randomBytes } from "node:crypto";
import type { AssessmentConfiguration } from "./assessment-configuration.ts";

export const BANK_VERSION = bankJson.bankVersion;
// Wording and split-item revisions retain the same scoring contract. Old
// attempts must continue scoring their own frozen questions, never today's bank.
const SUPPORTED_BANK_VERSIONS = new Set(["adult-integrated-83-v1", BANK_VERSION]);
export const SCORING_VERSION = "independent-weighted-mean-v1";
export type Category = "APEST" | "Gift" | "Strength" | "Personality";
export type Answer = 1 | 2 | 3 | 4 | 5 | "na" | "skip";
export type Answers = Record<string, Answer>;
export interface Question {
  id: string;
  text: string;
  responseModel: string;
  poles?: string[];
  kind?: string;
  construct?: string;
  maps: { category: Category; construct: string; weight: number }[];
}
export interface IntegratedSnapshot {
  bankVersion: string;
  scoringVersion: string;
  startedAt: string;
  adultConfirmed: true;
  celibacyEligible: boolean;
  optionalExperienceOptIn: boolean;
  assessmentConfiguration: AssessmentConfiguration;
  ministryCustomization: unknown;
  enabledSpiritualGifts: string[];
  questionIds: string[];
  questions: Question[];
  responseModels: typeof bankJson.responseModels;
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
export const INTEGRATED_BANK = deepFreeze(bankJson);
export type RandomSource = () => number;
const secureRandom: RandomSource = () => randomBytes(4).readUInt32BE(0) / 0x1_0000_0000;

function shuffle<T>(items: T[], random: RandomSource): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError("Random source must return a finite number in [0, 1).");
    }
    const swapIndex = Math.floor(value * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

/** Randomize fresh attempts while rotating among constructs and keeping the
 * bipolar personality inventory together. This only changes presentation order;
 * question identities and scoring mappings remain untouched. */
export function orderIntegratedQuestions(questions: Question[], random: RandomSource = secureRandom): Question[] {
  const bipolar: Question[] = [];
  const optional: Question[] = [];
  const groups = new Map<string, Question[]>();
  for (const question of questions) {
    if (question.responseModel === "personalityBipolar") {
      bipolar.push(question);
      continue;
    }
    if (!question.maps.length) {
      optional.push(question);
      continue;
    }
    const primaryMap = question.maps.find(map => map.category !== "Personality") ?? question.maps[0];
    const key = `${primaryMap.category}:${primaryMap.construct}`;
    const group = groups.get(key) ?? [];
    group.push(question);
    groups.set(key, group);
  }

  const shuffledGroups = shuffle([...groups.values()].map(group => shuffle(group, random)), random);
  const interleaved: Question[] = [];
  for (let round = 0; shuffledGroups.some(group => group.length > round); round++) {
    for (const group of shuffledGroups) {
      if (group[round]) interleaved.push(group[round]);
    }
  }

  const bipolarBlock = shuffle(bipolar, random);
  const insertionPoint = Math.floor(interleaved.length / 2);
  return [
    ...interleaved.slice(0, insertionPoint),
    ...bipolarBlock,
    ...interleaved.slice(insertionPoint),
    ...shuffle(optional, random),
  ];
}

const sectionKeys = { APEST: "apest", Gift: "spiritualGifts", Strength: "naturalStrengths", Personality: "personalityStrengths" } as const;
const subsectionNames: Record<string, string> = {
  Apostle: "builder", Prophet: "insight", Evangelist: "connector", Shepherd: "caregiver", Teacher: "teacher",
  "Relational connection": "relationalConnection", Encouragement: "encouragement",
  "Teaching and explaining": "teachingExplaining", Listening: "listening",
  "Leadership and initiative": "leadershipInitiative", Organizing: "organizing",
  "Creative expression": "creativeExpression", "Problem-solving": "problemSolving",
  "Practical hands-on work": "practicalHandsOn", Hospitality: "hospitality",
  "Compassion and care": "compassionCare", "Communication and storytelling": "communicationStorytelling",
  Discernment: "discernment", "Follow-through": "followThrough", Adaptability: "adaptability",
  "Mentoring and development": "mentoringDevelopment", "Strategic thinking": "strategicThinking",
  "Advocacy and justice": "advocacyJustice",
  "Social Energy": "socialEnergy", "Decision Lens": "decisionLens", "Planning Style": "planningStyle",
  "Focus Style": "focusStyle", "Action Style": "actionStyle", "Pace Preference": "pacePreference", "Work Style": "workStyle",
};
export function constructKeys(category: Category, construct: string) {
  const sectionKey = sectionKeys[category];
  return { sectionKey, subsectionKey: category === "Gift" ? null : `${sectionKey}.${subsectionNames[construct]}` };
}

export function createIntegratedSnapshot(input: {
  configuration: AssessmentConfiguration;
  customization: unknown;
  enabledGifts: string[];
  celibacyEligible: boolean;
  optionalExperienceOptIn: boolean;
}, now = new Date(), random: RandomSource = secureRandom): IntegratedSnapshot {
  const mapEnabled = (map: Question["maps"][number]) => {
    const { sectionKey, subsectionKey } = constructKeys(map.category, map.construct);
    if (!input.configuration.sections[sectionKey]) return false;
    if (map.category === "Gift") {
      return input.enabledGifts.includes(map.construct) && (map.construct !== "Celibacy" || input.celibacyEligible);
    }
    return !!input.configuration.subsections[subsectionKey as keyof AssessmentConfiguration["subsections"]];
  };
  const core = (INTEGRATED_BANK.coreQuestions as Question[])
    .map(question => ({ ...question, maps: question.maps.filter(mapEnabled) }))
    .filter(question => question.maps.length > 0);
  const optional = input.optionalExperienceOptIn && input.configuration.sections.spiritualGifts
    ? (INTEGRATED_BANK.optionalQuestions as Question[]).filter(q => input.enabledGifts.includes(q.construct!))
    : [];
  const questions = orderIntegratedQuestions([...core, ...optional], random);
  return structuredClone({
    bankVersion: BANK_VERSION, scoringVersion: SCORING_VERSION, startedAt: now.toISOString(),
    adultConfirmed: true, celibacyEligible: input.celibacyEligible,
    optionalExperienceOptIn: input.optionalExperienceOptIn,
    assessmentConfiguration: input.configuration, ministryCustomization: input.customization,
    enabledSpiritualGifts: input.enabledGifts, questionIds: questions.map(q => q.id),
    questions, responseModels: INTEGRATED_BANK.responseModels,
  });
}

export function answersError(value: unknown, snapshot: IntegratedSnapshot, complete = false): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Answers must be a question-keyed object.";
  const ids = new Set(snapshot.questionIds);
  for (const [id, answer] of Object.entries(value)) {
    if (!ids.has(id)) return "Answers contain a question not present in this frozen assessment.";
    if (answer !== "na" && answer !== "skip" && !(typeof answer === "number" && Number.isInteger(answer) && answer >= 1 && answer <= 5)) {
      return "Answer choices must be 1–5, na, or skip.";
    }
  }
  if (complete && snapshot.questions.some(q => q.maps.length > 0 && !Object.hasOwn(value, q.id))) {
    return "Review every core question and select a response, N/A, or skip before completing.";
  }
  return null;
}

export function scoreIntegratedAssessment(snapshot: IntegratedSnapshot, answers: Answers, completedAt = new Date()) {
  if (!SUPPORTED_BANK_VERSIONS.has(snapshot.bankVersion) || snapshot.scoringVersion !== SCORING_VERSION) {
    throw new Error("This frozen assessment scoring version is not supported by this server.");
  }
  const error = answersError(answers, snapshot);
  if (error) throw new Error(error);
  const groups = new Map<string, { category: Category; construct: string; questions: { question: Question; weight: number }[] }>();
  for (const question of snapshot.questions) {
    for (const map of question.maps) {
      const key = `${map.category}:${map.construct}`;
      if (!groups.has(key)) groups.set(key, { category: map.category, construct: map.construct, questions: [] });
      // A question is a single observation even when it contributes across categories.
      if (!groups.get(key)!.questions.some(entry => entry.question.id === question.id)) {
        groups.get(key)!.questions.push({ question, weight: map.weight });
      }
    }
  }
  const constructs = [...groups.values()].map(({ category, construct, questions }) => {
    const answered = questions.filter(({ question }) => typeof answers[question.id] === "number");
    const answeredWeight = answered.reduce((sum, entry) => sum + entry.weight, 0);
    const eligible = answered.length >= 3;
    const mean = eligible
      ? answered.reduce((sum, entry) => sum + (answers[entry.question.id] as number) * entry.weight, 0) / answeredWeight
      : null;
    const poles = category === "Personality" ? questions[0].question.poles ?? null : null;
    const tendency = mean !== null && poles ? mean < 2.5 ? poles[0] : mean > 3.5 ? poles[1] : "Balanced / flexible" : null;
    return {
      category, construct, ...constructKeys(category, construct),
      mean, answeredCount: answered.length, availableCount: questions.length, answeredWeight,
      eligible, evidence: eligible ? "sufficient" as const : "insufficient" as const, poles, tendency,
    };
  });
  return {
    version: "integrated-assessment-v1" as const,
    bankVersion: snapshot.bankVersion, scoringVersion: snapshot.scoringVersion,
    completedAt: completedAt.toISOString(), snapshot, answers, constructs,
    optionalExperiences: snapshot.questions.filter(q => q.maps.length === 0).map(q => ({
      questionId: q.id, construct: q.construct!, kind: q.kind!, text: q.text, answer: answers[q.id] ?? null,
    })),
    conversationOnlyGifts: snapshot.assessmentConfiguration.sections.spiritualGifts && snapshot.enabledSpiritualGifts.includes("Discernment of Spirits")
      ? ["Discernment of Spirits"] : [],
    limitations: [
      "Adult reflection, not a validated psychometric assessment, calling, placement, or proof of a spiritual gift.",
      "Categories are scored independently; shared answers are correlated evidence, not independent confirmations.",
      "At least three distinct numeric responses are needed for a meaningful construct result. N/A and skips are excluded.",
      "Optional spiritual experiences and Discernment of Spirits belong in pastoral conversation, never automated inference.",
    ],
  };
}
export type IntegratedResult = ReturnType<typeof scoreIntegratedAssessment>;

const apestLabels: Record<string, string> = {
  Apostle: "Starting and building new ministry", Prophet: "Noticing what needs attention",
  Evangelist: "Connecting people with faith", Shepherd: "Caring for people over time", Teacher: "Making ideas clear",
};
/** Only server-scored, evidence-qualified canonical aggregates enter AI/matching.
 * A sufficient low score is not positive evidence. No optional experience is an AI signal.
 * Null means genuinely legacy (no envelope). A present but unsupported envelope
 * returns empty signals, so every consumer fails closed instead of falling back
 * to legacy labels/answers that may also be present on the record. */
export function integratedSignals(value: unknown) {
  if (value == null) return null;
  const empty = {
    ministryTendencies: [] as string[], spiritualGifts: [] as string[],
    strengths: [] as string[], personalityTendencies: [] as string[],
  };
  if (typeof value !== "object" || Array.isArray(value)) return empty;
  const result = value as IntegratedResult;
  if (
    result.version !== "integrated-assessment-v1" ||
    !SUPPORTED_BANK_VERSIONS.has(result.bankVersion) ||
    result.scoringVersion !== SCORING_VERSION ||
    !Array.isArray(result.constructs)
  ) return empty;
  const eligible = result.constructs.filter(c => c && typeof c === "object" &&
    c.eligible && c.evidence === "sufficient" && c.answeredCount >= 3 &&
    typeof c.mean === "number" && Number.isFinite(c.mean) && c.mean >= 1 && c.mean <= 5);
  const labels = (category: Category) => eligible.filter(c => c.category === category && c.mean! >= 3.5).map(c => c.construct);
  return {
    ministryTendencies: labels("APEST").map(name => apestLabels[name]).filter(Boolean),
    spiritualGifts: labels("Gift"),
    strengths: labels("Strength"),
    personalityTendencies: eligible.filter(c => c.category === "Personality" && c.tendency).map(c => `${c.construct}: ${c.tendency}`),
  };
}