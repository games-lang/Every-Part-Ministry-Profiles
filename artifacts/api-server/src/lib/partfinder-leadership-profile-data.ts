export type LeadershipProfileData = {
  priorities: string[];
  energizingAreas: string;
  drainingAreas: string;
  delegationNeeds: string;
  churchChallenges: string;
  strengthenAreas: string;
  leadersToDevelop: string;
  leadershipStrengths: string[];
  growthAreas: string[];
  goals3Months: string;
  goals1Year: string;
  helpPreferences: string[];
  coachingStyle: "encouraging" | "balanced" | "direct";
  responseLength: "brief" | "standard" | "detailed";
};

export const DEFAULT_PARTFINDER_LEADERSHIP_PROFILE: LeadershipProfileData = {
  priorities: [],
  energizingAreas: "",
  drainingAreas: "",
  delegationNeeds: "",
  churchChallenges: "",
  strengthenAreas: "",
  leadersToDevelop: "",
  leadershipStrengths: [],
  growthAreas: [],
  goals3Months: "",
  goals1Year: "",
  helpPreferences: [],
  coachingStyle: "balanced",
  responseLength: "standard",
};

function strings(value: unknown, limit: number, itemLimit: number): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().slice(0, itemLimit))
      .filter(Boolean),
  )].slice(0, limit);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 1000) : "";
}

export function normalizeLeadershipProfile(
  value: Partial<LeadershipProfileData>,
): LeadershipProfileData {
  return {
    priorities: strings(value.priorities, 3, 160),
    energizingAreas: text(value.energizingAreas),
    drainingAreas: text(value.drainingAreas),
    delegationNeeds: text(value.delegationNeeds),
    churchChallenges: text(value.churchChallenges),
    strengthenAreas: text(value.strengthenAreas),
    leadersToDevelop: text(value.leadersToDevelop),
    leadershipStrengths: strings(value.leadershipStrengths, 8, 100),
    growthAreas: strings(value.growthAreas, 8, 100),
    goals3Months: text(value.goals3Months),
    goals1Year: text(value.goals1Year),
    helpPreferences: strings(value.helpPreferences, 14, 80),
    coachingStyle:
      value.coachingStyle === "encouraging" || value.coachingStyle === "direct"
        ? value.coachingStyle
        : "balanced",
    responseLength:
      value.responseLength === "brief" || value.responseLength === "detailed"
        ? value.responseLength
        : "standard",
  };
}

type LeadershipProfileRecord = {
  profile: Partial<LeadershipProfileData>;
  personalizationEnabled: boolean;
  updatedAt: Date;
};

export function leadershipProfileResponse(
  record: LeadershipProfileRecord | undefined,
) {
  if (!record) {
    return {
      ...DEFAULT_PARTFINDER_LEADERSHIP_PROFILE,
      personalizationEnabled: true,
      configured: false,
      updatedAt: null,
    };
  }
  return {
    ...normalizeLeadershipProfile(record.profile),
    personalizationEnabled: record.personalizationEnabled,
    configured: true,
    updatedAt: record.updatedAt,
  };
}