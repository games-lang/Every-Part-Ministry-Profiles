import type { MinistryProfile } from "@workspace/db";

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

export function profileResponse(profile: MinistryProfile) {
  return {
    ...profileListItem(profile),
    basicInformation: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      ageRange: profile.ageRange,
      preferredContact: profile.preferredContact,
      familySituation: profile.familySituation,
      transportation: profile.transportation,
    },
    churchConnection: {
      attendanceLength: profile.attendanceLength,
      connectionLevel: profile.connectionLevel,
      followingJesusLength: profile.followingJesusLength,
      servedBefore: profile.servedBefore,
      previousService: profile.previousService,
    },
    skills: {
      occupation: profile.occupation,
      uniqueSkills: profile.uniqueSkills,
      previousMinistryExperience: profile.previousMinistryExperience,
      leadershipExperience: profile.leadershipExperience,
      missionTripExperience: profile.missionTripExperience,
      lifeExperience: profile.lifeExperience,
    },
    experience:
      profile.previousMinistryExperience ??
      profile.lifeExperience ??
      "No experience details provided.",
    assessmentSections: {
      apest: profile.apest,
      spiritualGifts: profile.spiritualGifts,
      personalityStrengths: profile.personalityStrengths,
      spiritualHealth: profile.spiritualHealth,
    },
    conversations: possibleConversations(profile),
  };
}
