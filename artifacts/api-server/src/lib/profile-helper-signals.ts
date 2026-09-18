import type { MinistryProfile } from "@workspace/db";
import { integratedSignals } from "./integrated-assessment.ts";
import {
  DEFAULT_MINISTRY_INTERESTS,
  DEFAULT_PASSIONS,
} from "./assessment-configuration.ts";
import { SUPPORTED_SPIRITUAL_GIFT_NAMES } from "./spiritual-gifts.ts";

const SAFE_MINISTRY_TENDENCIES = new Set([
  "Starting and building new ministry",
  "Noticing what needs attention",
  "Connecting people with faith",
  "Caring for people over time",
  "Making ideas clear",
]);
const SAFE_STRENGTHS = new Set([
  "Relational connection",
  "Encouragement",
  "Teaching and explaining",
  "Listening",
  "Leadership and initiative",
  "Organizing",
  "Creative expression",
  "Problem-solving",
  "Practical hands-on work",
  "Hospitality",
  "Compassion and care",
  "Communication and storytelling",
  "Discernment",
  "Follow-through",
  "Adaptability",
  "Mentoring and development",
  "Strategic thinking",
  "Advocacy and justice",
]);
const SAFE_PERSONALITY_LABELS = new Set([
  "Social Energy",
  "Decision Lens",
  "Planning Style",
  "Focus Style",
  "Action Style",
  "Pace Preference",
  "Work Style",
]);
const SAFE_SPIRITUAL_GIFTS = new Set<string>(SUPPORTED_SPIRITUAL_GIFT_NAMES);

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringList(value: unknown, allowed?: Set<string>, limit = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && (!allowed || allowed.has(entry)))
    .slice(0, limit);
}

function topGifts(value: unknown): string[] {
  const record = objectRecord(value);
  const selected = stringList(record.topGifts, SAFE_SPIRITUAL_GIFTS, 5);
  if (selected.length) return selected;
  const responses = objectRecord(record.responses);
  return Object.entries(responses)
    .map(([gift, entries]) => {
      const scores = Array.isArray(entries)
        ? entries
            .map((entry) => objectRecord(entry).response)
            .filter((response): response is number => typeof response === "number")
        : [];
      return {
        gift,
        score: scores.length
          ? scores.reduce((total, score) => total + score, 0) / scores.length
          : 0,
      };
    })
    .filter(({ gift, score }) => score > 0 && SAFE_SPIRITUAL_GIFTS.has(gift))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ gift }) => gift);
}

export function profileHelperSignals(profile: MinistryProfile) {
  const integrated = integratedSignals(profile.integratedAssessment);
  const ministry = objectRecord(profile.apest);
  const strengths = objectRecord(profile.naturalStrengths);
  const personality = objectRecord(profile.personalityStrengths);
  const dimensions = Array.isArray(personality.dimensions)
    ? personality.dimensions
        .map(objectRecord)
        .map((dimension) => {
          const label = typeof dimension.label === "string" ? dimension.label : "";
          const tendency = typeof dimension.tendency === "string" ? dimension.tendency : "";
          return SAFE_PERSONALITY_LABELS.has(label) && tendency
            ? `${label}: ${tendency}`
            : "";
        })
        .filter(Boolean)
        .slice(0, 7)
    : [];

  return {
    pathway: "adult",
    ministryInterests: stringList(profile.interests, new Set(DEFAULT_MINISTRY_INTERESTS)),
    passions: stringList(profile.passions, new Set(DEFAULT_PASSIONS)),
    availability: stringList(profile.availability, undefined, 5),
    servingFrequency:
      typeof profile.servingFrequency === "string" ? profile.servingFrequency : null,
    ministryTendencies: [
      ministry.primary,
      ministry.secondary,
    ].filter(
      (value): value is string =>
        typeof value === "string" && SAFE_MINISTRY_TENDENCIES.has(value),
    ),
    spiritualGifts: topGifts(profile.spiritualGifts),
    strengths: stringList(strengths.selected, SAFE_STRENGTHS, 5),
    personalityTendencies: dimensions,
    ...(integrated ?? {}),
  };
}