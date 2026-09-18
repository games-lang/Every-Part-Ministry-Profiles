import bankJson from "./integrated-bank.json" with { type: "json" };
import type { AssessmentConfiguration } from "./assessment-configuration.ts";

export const BANK_VERSION = "adult-integrated-83-v1";
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
}, now = new Date()): IntegratedSnapshot {
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
  const questions = [...core, ...optional];
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
  if (snapshot.bankVersion !== BANK_VERSION || snapshot.scoringVersion !== SCORING_VERSION) {
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
      "Adult pilot reflection, not a validated psychometric assessment, calling, placement, or proof of a spiritual gift.",
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
    result.bankVersion !== BANK_VERSION ||
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