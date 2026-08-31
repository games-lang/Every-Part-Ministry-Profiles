import { z } from "zod/v4";

export const YOUTH_PROFILE_TYPES = ["discover", "explore", "develop"] as const;
export type YouthProfileType = (typeof YOUTH_PROFILE_TYPES)[number];

const text = (max: number) =>
  z.string().trim().min(1).max(max).refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Text contains invalid characters");
const optionalText = (max: number) => text(max).optional();
const shortList = (maxItems: number, maxLength = 80) =>
  z.array(text(maxLength)).min(1).max(maxItems);

// These are intentionally server-owned. A client cannot invent an opportunity
// category and have it appear in a stored child response.
export const YOUTH_OPPORTUNITY_KEYS = [
  "welcome", "kids", "students", "worship", "production", "prayer",
  "hospitality", "communityCare", "outreach", "creative", "behindTheScenes",
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

const opportunitySchema = z
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
    opportunities: opportunitySchema,
  }).strict(),
  guardianObservations: z.object({
    strengths: optionalText(500),
    comesAlive: optionalText(500),
    comfortableOpportunities: optionalText(500),
    thriveNotes: optionalText(1000),
  }).strict().optional(),
}).strict();

export type DiscoverSubmission = z.infer<typeof discoverSubmissionSchema>;

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