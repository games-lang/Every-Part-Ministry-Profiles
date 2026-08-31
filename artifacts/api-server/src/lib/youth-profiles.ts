import { z } from "zod/v4";

export const YOUTH_PROFILE_TYPES = ["discover", "explore", "develop"] as const;
export type YouthProfileType = (typeof YOUTH_PROFILE_TYPES)[number];

const text = (max: number) =>
  z.string().trim().min(1).max(max).refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Text contains invalid characters");
const optionalText = (max: number) => text(max).optional();
const shortList = (maxItems: number, maxLength = 80) =>
  z.array(text(maxLength)).min(1).max(maxItems);
const uniqueShortList = (maxItems: number, maxLength = 80) =>
  shortList(maxItems, maxLength).refine(
    (values) => new Set(values.map((value) => value.toLocaleLowerCase())).size === values.length,
    "Choices must be unique.",
  );

// These are intentionally server-owned. A client cannot invent an opportunity
// category and have it appear in a stored child response.
export const YOUTH_OPPORTUNITY_KEYS = [
  "welcome", "kids", "students", "worship", "production", "prayer",
  "hospitality", "communityCare", "outreach", "creative", "behindTheScenes",
] as const;
export const EXPLORE_OPPORTUNITY_KEYS = [
  "welcome", "prayer", "kids", "worship", "scriptureReading", "production",
  "communityCare", "missions", "encouragementCards", "hospitality", "setup",
  "creative", "events",
] as const;

export function pathwayForAge(age: number): "discover" | "explore" | "develop" | "adult" {
  if (!Number.isInteger(age) || age < 6 || age > 120) {
    throw new Error("Age must be a whole number from 6 to 120.");
  }
  if (age <= 8) return "discover";
  if (age <= 12) return "explore";
  if (age <= 17) return "develop";
  return "adult";
}

/** Whether a requested pathway differs from the age-derived pathway. */
export function pathwayOverrideRequired(
  requested: "adult" | YouthProfileType,
  recommended: "adult" | YouthProfileType,
): boolean {
  return requested !== recommended;
}

const discoverOpportunitySchema = z
  .object(
    Object.fromEntries(
      YOUTH_OPPORTUNITY_KEYS.map((key) => [key, z.enum(["love", "maybe", "not-now"]).optional()]),
    ),
  )
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Choose at least one opportunity.");

export const discoverSubmissionSchema = z.object({
  churchSlug: text(120),
  age: z.number().int().min(6).max(120),
  birthdate: z.string().date().optional(),
  profileType: z.literal("discover"),
  child: z.object({ firstName: text(80), lastName: text(80) }).strict(),
  guardian: z.object({
    name: text(120),
    email: z.string().trim().email().max(254),
    consent: z.literal(true),
  }).strict(),
  answers: z.object({
    aboutMe: z.object({
      likes: shortList(8),
      goodAt: text(300),
      wantToLearn: text(300),
    }).strict(),
    tendencies: z.object({
      peopleEnergy: z.enum(["love", "sometimes", "quiet"]),
      newThings: z.enum(["love", "sometimes", "not-yet"]),
      helpingResponse: z.enum(["jump-in", "ask-first", "prefer-support"]),
      enjoys: shortList(8),
    }).strict(),
    caresAbout: shortList(8),
    waysToHelp: shortList(8),
    growingWithJesus: z.object({
      interests: shortList(8),
      helperName: optionalText(120),
      wantsHelpWith: optionalText(300),
    }).strict(),
    opportunities: discoverOpportunitySchema,
  }).strict(),
  guardianObservations: z.object({
    strengths: optionalText(500),
    comesAlive: optionalText(500),
    comfortableOpportunities: optionalText(500),
    thriveNotes: optionalText(1000),
  }).strict().optional(),
}).strict();

export type DiscoverSubmission = z.infer<typeof discoverSubmissionSchema>;

const exploreOperationSchema = z.object({
  peopleEnergy: z.enum(["being-with-people", "mix-of-both", "quiet-time"]),
  decisionStyle: z.enum(["talk-it-out", "think-it-through", "try-and-see"]),
  planningStyle: z.enum(["plan-ahead", "little-plan", "go-with-the-flow"]),
  focusStyle: z.enum(["one-thing", "switch-it-up", "notice-details"]),
  actionStyle: z.enum(["jump-in", "help-behind-scenes", "ask-first"]),
  reflection: optionalText(300),
}).strict();

const exploreOpportunitySchema = z.object(
  Object.fromEntries(
    EXPLORE_OPPORTUNITY_KEYS.map((key) => [key, z.enum(["love", "maybe", "not-now"]).optional()]),
  ),
).strict()
  .refine((value) => Object.keys(value).length > 0, "Choose at least one opportunity.")
  .refine(
    (value) => Object.values(value).filter((response) => response !== "not-now").length >= 2,
    "Choose at least two opportunities you would love or might like to try.",
  );

export const exploreSubmissionSchema = z.object({
  churchSlug: text(120),
  age: z.number().int().min(9).max(12),
  birthdate: z.string().date().optional(),
  profileType: z.literal("explore"),
  child: z.object({ firstName: text(80), lastName: text(80) }).strict(),
  guardian: z.object({
    name: text(120),
    email: z.string().trim().email().max(254),
    consent: z.literal(true),
  }).strict(),
  answers: z.object({
    aboutMe: z.object({
      likes: uniqueShortList(8),
      goodAt: text(300),
      wantToLearn: text(300),
    }).strict(),
    howITendToOperate: exploreOperationSchema,
    peopleAndNeeds: uniqueShortList(8),
    waysIEnjoyHelping: uniqueShortList(8),
    growingWithJesus: z.object({
      interests: uniqueShortList(8),
      helperName: optionalText(120),
      wantsHelpWith: optionalText(300),
    }).strict(),
    opportunities: exploreOpportunitySchema,
  }).strict(),
  guardianObservations: z.object({
    strengths: optionalText(500),
    comesAlive: optionalText(500),
    comfortableOpportunities: optionalText(500),
    thriveNotes: optionalText(1000),
  }).strict().optional(),
}).strict();

export type ExploreSubmission = z.infer<typeof exploreSubmissionSchema>;

const EXPLORE_OPPORTUNITY_LABELS: Record<(typeof EXPLORE_OPPORTUNITY_KEYS)[number], string> = {
  welcome: "Welcome",
  prayer: "Prayer",
  kids: "Kids",
  worship: "Worship / music",
  scriptureReading: "Scripture reading",
  production: "Tech",
  communityCare: "Community service",
  missions: "Missions projects",
  encouragementCards: "Encouragement / cards",
  hospitality: "Hospitality",
  setup: "Setup",
  creative: "Creative projects",
  events: "Helping with events",
};

export const EXPLORE_COMPLETION_COPY =
  "You are still growing and discovering how God has made you. These results are a starting point for conversations, prayer, serving, and learning—not a permanent label.";

function exploreTendencySummary(answers: ExploreSubmission["answers"]): string {
  const tendencies = answers.howITendToOperate;
  const people = {
    "being-with-people": "may be energized by being with people",
    "mix-of-both": "may enjoy a mix of time with people and quiet time",
    "quiet-time": "may recharge with some quiet time",
  }[tendencies.peopleEnergy];
  const decisions = {
    "talk-it-out": "often likes to talk ideas out",
    "think-it-through": "often likes to think things through first",
    "try-and-see": "may like to try an idea and see how it goes",
  }[tendencies.decisionStyle];
  const planning = {
    "plan-ahead": "may enjoy a clear plan",
    "little-plan": "may like having a little plan with room to adjust",
    "go-with-the-flow": "may be comfortable adapting as things change",
  }[tendencies.planningStyle];
  const focus = {
    "one-thing": "may like focusing on one thing at a time",
    "switch-it-up": "may enjoy changing between different tasks",
    "notice-details": "often notices details",
  }[tendencies.focusStyle];
  const action = {
    "jump-in": "may be ready to jump in and help",
    "help-behind-scenes": "may enjoy helping behind the scenes",
    "ask-first": "may like asking how to help first",
  }[tendencies.actionStyle];
  return `You ${people}, ${decisions}, ${planning}, ${focus}, and ${action}.`;
}

/**
 * Produces repeatable, non-placement ideas from the child's own selections.
 * It ranks child-selected opportunity responses with matching text signals,
 * then uses the server-owned opportunity order as a stable tie-breaker.
 */
export function exploreResultSummary(answers: ExploreSubmission["answers"]) {
  const answerSignals = [
    ...answers.waysIEnjoyHelping,
    ...answers.peopleAndNeeds,
    ...answers.growingWithJesus.interests,
    answers.howITendToOperate.peopleEnergy,
    answers.howITendToOperate.decisionStyle,
    answers.howITendToOperate.planningStyle,
    answers.howITendToOperate.focusStyle,
    answers.howITendToOperate.actionStyle,
  ];
  const keywords: Record<(typeof EXPLORE_OPPORTUNITY_KEYS)[number], string[]> = {
    welcome: ["welcome", "new people", "new kid", "greet"],
    prayer: ["prayer", "pray"],
    kids: ["kid", "child", "children", "younger"],
    worship: ["music", "worship", "sing", "instrument"],
    scriptureReading: ["scripture", "bible", "reading"],
    production: ["tech", "technology", "video", "sound", "computer"],
    communityCare: ["community", "care", "need", "help"],
    missions: ["mission", "outreach", "world"],
    encouragementCards: ["encourage", "card", "kind", "note"],
    hospitality: ["hospital", "food", "host", "welcome"],
    setup: ["setup", "set up", "organize", "behind the scenes"],
    creative: ["creative", "art", "draw", "design", "make"],
    events: ["event", "party", "activity"],
  };
  const matchingSignals = (key: (typeof EXPLORE_OPPORTUNITY_KEYS)[number]) =>
    answerSignals.filter((signal) =>
      keywords[key].some((keyword) => {
        const normalized = signal.toLocaleLowerCase();
        return keyword.includes(" ")
          ? normalized.includes(keyword)
          : normalized.split(/[^a-z]+/).includes(keyword);
      }),
    ).slice(0, 1);
  const selected = EXPLORE_OPPORTUNITY_KEYS
    .map((key, index) => ({ key, index, response: answers.opportunities[key], signals: matchingSignals(key) }))
    .filter((item) => item.response === "love" || item.response === "maybe")
    .sort((left, right) =>
      (right.signals.length - left.signals.length)
      || ((right.response === "love" ? 1 : 0) - (left.response === "love" ? 1 : 0))
      || (left.index - right.index),
    )
    .slice(0, 4);
  const suggestions = selected.map(({ key, response, signals }) => {
    const marked = `marked ${EXPLORE_OPPORTUNITY_LABELS[key]} as ${response === "love" ? "love" : "maybe"}`;
    return {
      opportunityKey: key,
      opportunityLabel: EXPLORE_OPPORTUNITY_LABELS[key],
      reason: signals.length
        ? `You selected "${signals[0]}" and ${marked}.`
        : `You ${marked}.`,
    };
  });

  return {
    headline: `Here are a few things to keep exploring, starting with what you enjoy like ${answers.aboutMe.likes.slice(0, 2).join(" and ")}.`,
    strengths: [answers.aboutMe.goodAt, ...answers.waysIEnjoyHelping.slice(0, 2)].slice(0, 3),
    tendencySummary: exploreTendencySummary(answers),
    completionCopy: EXPLORE_COMPLETION_COPY,
    suggestions,
  };
}

export function youthResultSummary(answers: DiscoverSubmission["answers"]) {
  const favorites = answers.aboutMe.likes.slice(0, 2).join(" and ");
  return {
    headline: `You are discovering ways to use what you enjoy${favorites ? `, like ${favorites}` : ""}.`,
    nextStep: "You are still growing. These results are a starting point for conversation, prayer, serving, and learning with a trusted grown-up.",
    strengths: [answers.aboutMe.goodAt, ...answers.waysToHelp.slice(0, 2)].slice(0, 3),
    tentativeNote: "These are ideas to explore together, not a label or a placement.",
  };
}

export function adultProfilesOnly<T extends { profileType: string }>(profiles: T[]): T[] {
  return profiles.filter((profile) => profile.profileType === "adult");
}