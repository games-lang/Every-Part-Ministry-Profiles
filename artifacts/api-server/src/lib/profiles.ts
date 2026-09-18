import type { MinistryProfile } from "@workspace/db";
import {
  assessmentConfiguration,
  defaultAssessmentConfiguration,
  filterAssessmentSection,
} from "./assessment-configuration";

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
    profilePhotoUrl: profile.profilePhotoPath
      ? `/api/profiles/${profile.id}/photo`
      : null,
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

export function profileResponse(
  profile: MinistryProfile,
  branding: {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    accentColor: string;
  },
) {
  const configuration =
    assessmentConfiguration(profile.assessmentConfigurationSnapshot) ??
    defaultAssessmentConfiguration();
  return {
    ...profileListItem(profile),
    branding,
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
    integratedAssessment: profile.integratedAssessment ?? null,
    lifeExperiences: profile.lifeExperiences,
    availabilityDetails: profile.availabilityDetails,
    ministryPreferences: profile.ministryPreferences,
    conversations: possibleConversations(profile),
  };
}
