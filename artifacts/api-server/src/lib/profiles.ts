import type { MinistryProfile } from "@workspace/db";
import {
  assessmentConfiguration,
  defaultAssessmentConfiguration,
  DEFAULT_MINISTRY_INTERESTS,
  DEFAULT_PASSIONS,
  filterAssessmentSection,
} from "./assessment-configuration";
import { SUPPORTED_SPIRITUAL_GIFT_NAMES } from "./spiritual-gifts";

export function profileListItem(profile: MinistryProfile) {
  return {
    id: profile.id,
    memberName: `${profile.firstName} ${profile.lastName}`,
    email: profile.email,
    completedAt: profile.completedAt,
    interests: profile.interests,
    passions: profile.passions,
    availability: profile.availability,
    servingFrequency: profile.servingFrequency,
    teamId: profile.teamId,
    profileType: profile.profileType,
    age: profile.age,
    journeyToken: profile.personKey,
  };
}

export function possibleConversations(profile: MinistryProfile): string[] {
  return Array.from(
    new Set([
      ...profile.interests.slice(0, 3),
      ...profile.passions.slice(0, 2).map((passion) => `${passion} care`),
    ]),
  );
}

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
  const selected = stringList(record.topGifts, new Set(SUPPORTED_SPIRITUAL_GIFT_NAMES), 5);
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
    .filter(({ gift, score }) => score > 0 && SUPPORTED_SPIRITUAL_GIFT_NAMES.includes(gift))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ gift }) => gift);
}

export function profileHelperSignals(profile: MinistryProfile) {
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
  };
}

export function profileResponse(profile: MinistryProfile) {
  const configuration =
    assessmentConfiguration(profile.assessmentConfigurationSnapshot) ??
    defaultAssessmentConfiguration();
  return {
    ...profileListItem(profile),
    recommendedProfileType: profile.recommendedProfileType,
    profileTypeOverridden: profile.profileTypeOverridden,
    youthResponses: profile.youthResponses,
    guardianObservations: profile.guardianObservations,
    guardian: {
      name: profile.guardianName,
      email: profile.guardianEmail,
      consent: profile.guardianConsent,
    },
    youth: profile.profileType === "adult" ? null : {
      responses: profile.youthResponses,
      guardianObservations: profile.guardianObservations,
    },
    basicInformation: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      ageRange: profile.ageRange,
      preferredContact: profile.preferredContact,
      familySituation: profile.familySituation,
      transportation: profile.transportation,
      languages: profile.languages,
    },
    churchConnection: {
      attendanceLength: profile.attendanceLength,
      connectionLevel: profile.connectionLevel,
      followingJesusLength: profile.followingJesusLength,
      servedBefore: profile.servedBefore,
      previousService: profile.previousService,
      details: profile.churchDetails,
    },
    skills: {
      occupation: profile.occupation,
      uniqueSkills: profile.uniqueSkills,
      previousMinistryExperience: profile.previousMinistryExperience,
      leadershipExperience: profile.leadershipExperience,
      missionTripExperience: profile.missionTripExperience,
      lifeExperience: profile.lifeExperience,
      details: profile.skillsDetails,
    },
    experience:
      profile.previousMinistryExperience ??
      profile.lifeExperience ??
      "No experience details provided.",
    assessmentSections: {
      // Apply the snapshot on reads as well as writes. This protects profiles
      // created before server-side filtering existed and prevents a crafted
      // stored JSON value from being exposed.
      apest: filterAssessmentSection("apest", profile.apest, configuration),
      spiritualGifts: filterAssessmentSection(
        "spiritualGifts",
        profile.spiritualGifts,
        configuration,
      ),
      personalityStrengths: filterAssessmentSection(
        "personalityStrengths",
        profile.personalityStrengths,
        configuration,
      ),
      naturalStrengths: filterAssessmentSection(
        "naturalStrengths",
        profile.naturalStrengths,
        configuration,
      ),
      spiritualHealth: filterAssessmentSection(
        "spiritualHealth",
        profile.spiritualHealth,
        configuration,
      ),
    },
    assessmentConfiguration: configuration,
    lifeExperiences: profile.lifeExperiences,
    availabilityDetails: profile.availabilityDetails,
    ministryPreferences: profile.ministryPreferences,
    conversations: possibleConversations(profile),
  };
}
