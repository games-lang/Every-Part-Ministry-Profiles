import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  ministryJourneyEntriesTable,
  ministryJourneysTable,
  ministryProfilesTable,
  type MinistryJourney,
  type MinistryJourneyEntry,
  type MinistryProfile,
} from "@workspace/db";

export const JOURNEY_ENTRY_TYPES = ["check_in", "milestone"] as const;
export type JourneyEntryType = (typeof JOURNEY_ENTRY_TYPES)[number];

const pathwayLabels: Record<string, string> = {
  discover: "Discover",
  explore: "Explore",
  develop: "Develop",
  adult: "Ministry Profile",
};

const opportunityLabels: Record<string, string> = {
  welcome: "Welcoming people",
  kids: "Children",
  students: "Students",
  worship: "Worship",
  production: "Production",
  prayer: "Prayer",
  hospitality: "Hospitality",
  communityCare: "Community care",
  outreach: "Outreach",
  creative: "Creative expression",
  behindTheScenes: "Behind-the-scenes service",
  scriptureReading: "Scripture reading",
  missions: "Missions",
  encouragementCards: "Encouragement",
  setup: "Set-up and practical help",
  events: "Events",
};

export function nextProfileFor(profileType: string): string | null {
  if (profileType === "discover") return "explore";
  if (profileType === "explore") return "develop";
  if (profileType === "develop") return "adult";
  return null;
}

export async function updateJourneyAfterProfile(
  journeyId: string,
  profileType: string,
  completedAt = new Date(),
) {
  const nextCheckInDate = new Date(completedAt);
  nextCheckInDate.setUTCFullYear(nextCheckInDate.getUTCFullYear() + 1);
  await db
    .update(ministryJourneysTable)
    .set({
      nextProfileType: nextProfileFor(profileType),
      nextCheckInDate: nextCheckInDate.toISOString().slice(0, 10),
    })
    .where(eq(ministryJourneysTable.id, journeyId));
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function opportunityThemes(value: unknown): string[] {
  return Object.entries(record(value))
    .filter(([, response]) => response === "love" || response === "maybe")
    .map(([key]) => opportunityLabels[key] ?? key);
}

export function profileThemes(profile: MinistryProfile): string[] {
  if (profile.profileType === "adult") {
    return Array.from(new Set([...profile.passions, ...profile.interests])).slice(0, 12);
  }

  const answers = record(profile.youthResponses);
  const themes =
    profile.profileType === "discover"
      ? [
          ...stringList(record(answers.aboutMe).likes),
          ...stringList(record(answers.tendencies).enjoys),
          ...stringList(answers.caresAbout),
          ...stringList(answers.waysToHelp),
          ...stringList(record(answers.growingWithJesus).interests),
          ...opportunityThemes(answers.opportunities),
        ]
      : profile.profileType === "explore"
        ? [
            ...stringList(record(answers.aboutMe).likes),
            ...stringList(answers.peopleAndNeeds),
            ...stringList(answers.waysIEnjoyHelping),
            ...stringList(record(answers.growingWithJesus).interests),
            ...opportunityThemes(answers.opportunities),
          ]
        : [
            ...stringList(record(answers.aboutMe).likes),
            ...stringList(record(answers.giftsToExplore).interests),
            ...stringList(record(answers.passions).peopleAndCauses),
            ...Object.entries(record(answers.ministryInterests))
              .filter(([, response]) => response === "love" || response === "maybe")
              .map(([key]) => opportunityLabels[key] ?? key),
          ];
  return Array.from(new Set(themes)).slice(0, 12);
}

function cleanThemes(themes: string[]): string[] {
  return Array.from(
    new Map(
      themes
        .map((theme) => theme.trim())
        .filter(Boolean)
        .map((theme) => [theme.toLowerCase(), theme] as const),
    ).values(),
  );
}

export function journeyPatterns(profiles: MinistryProfile[]) {
  const ordered = [...profiles].sort(
    (a, b) => a.completedAt.getTime() - b.completedAt.getTime(),
  );
  const themeSets = ordered.map((profile) => cleanThemes(profileThemes(profile)));
  const counts = new Map<string, number>();
  themeSets.forEach((themes) =>
    themes.forEach((theme) => counts.set(theme.toLowerCase(), (counts.get(theme.toLowerCase()) ?? 0) + 1)),
  );
  const consistent = Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);
  const latest = themeSets.at(-1) ?? [];
  const previous = new Set(themeSets.slice(0, -1).flat().map((theme) => theme.toLowerCase()));
  const emerging = latest
    .filter((theme) => !previous.has(theme.toLowerCase()))
    .slice(0, 5);
  return { consistent, emerging };
}

export async function getOrCreateJourney(
  churchId: number,
  accessToken: string | undefined,
  nextProfileType: string,
): Promise<MinistryJourney> {
  if (accessToken) {
    const [existing] = await db
      .select()
      .from(ministryJourneysTable)
      .where(
        and(
          eq(ministryJourneysTable.churchId, churchId),
          eq(ministryJourneysTable.accessToken, accessToken),
        ),
      )
      .limit(1);
    if (existing) return existing;
  }
  const [created] = await db
    .insert(ministryJourneysTable)
    .values({ churchId, nextProfileType })
    .returning();
  if (!created) throw new Error("Unable to create ministry journey");
  return created;
}

export async function ensureJourneyForProfile(
  profile: MinistryProfile,
): Promise<MinistryJourney> {
  if (profile.journeyId) {
    const [journey] = await db
      .select()
      .from(ministryJourneysTable)
      .where(eq(ministryJourneysTable.id, profile.journeyId))
      .limit(1);
    if (journey) return journey;
  }
  const journey = await getOrCreateJourney(
    profile.churchId,
    undefined,
    profile.recommendedProfileType ?? profile.profileType,
  );
  await db
    .update(ministryProfilesTable)
    .set({ journeyId: journey.id, personKey: journey.accessToken })
    .where(eq(ministryProfilesTable.id, profile.id));
  return journey;
}

export async function journeyForAccessToken(accessToken: string) {
  const [journey] = await db
    .select()
    .from(ministryJourneysTable)
    .where(eq(ministryJourneysTable.accessToken, accessToken))
    .limit(1);
  return journey;
}

export async function journeyProfiles(journeyId: string) {
  return db
    .select()
    .from(ministryProfilesTable)
    .where(eq(ministryProfilesTable.journeyId, journeyId))
    .orderBy(asc(ministryProfilesTable.completedAt));
}

export async function journeyEntries(journeyId: string) {
  return db
    .select()
    .from(ministryJourneyEntriesTable)
    .where(eq(ministryJourneyEntriesTable.journeyId, journeyId))
    .orderBy(desc(ministryJourneyEntriesTable.occurredAt), desc(ministryJourneyEntriesTable.id));
}

export function publicJourneyProfile(profile: MinistryProfile) {
  return {
    id: profile.id,
    profileType: profile.profileType,
    profileLabel: pathwayLabels[profile.profileType] ?? profile.profileType,
    memberName: `${profile.firstName} ${profile.lastName}`,
    age: profile.age,
    completedAt: profile.completedAt,
    themes: profileThemes(profile).slice(0, 5),
  };
}

export function publicJourneyResponse(
  journey: MinistryJourney,
  profiles: MinistryProfile[],
  entries: MinistryJourneyEntry[],
) {
  const current = [...profiles].sort(
    (a, b) => b.completedAt.getTime() - a.completedAt.getTime(),
  )[0];
  const patterns = journeyPatterns(profiles);
  return {
    journeyToken: journey.accessToken,
    currentProfile: current
      ? {
          profileType: current.profileType,
          profileLabel: pathwayLabels[current.profileType] ?? current.profileType,
          completedAt: current.completedAt,
        }
      : null,
    nextProfileType: journey.nextProfileType,
    nextCheckInDate: journey.nextCheckInDate,
    profiles: profiles.map(publicJourneyProfile),
    entries,
    patterns,
  };
}

export function compareProfiles(left: MinistryProfile, right: MinistryProfile) {
  const leftThemes = cleanThemes(profileThemes(left));
  const rightThemes = cleanThemes(profileThemes(right));
  const rightSet = new Set(rightThemes.map((theme) => theme.toLowerCase()));
  const leftSet = new Set(leftThemes.map((theme) => theme.toLowerCase()));
  return {
    left: {
      id: left.id,
      profileType: left.profileType,
      profileLabel: pathwayLabels[left.profileType] ?? left.profileType,
      completedAt: left.completedAt,
      themes: leftThemes,
    },
    right: {
      id: right.id,
      profileType: right.profileType,
      profileLabel: pathwayLabels[right.profileType] ?? right.profileType,
      completedAt: right.completedAt,
      themes: rightThemes,
    },
    sharedThemes: leftThemes.filter((theme) => rightSet.has(theme.toLowerCase())),
    emergingThemes: rightThemes.filter((theme) => !leftSet.has(theme.toLowerCase())),
    note:
      "This comparison highlights shared and newly appearing themes for conversation. It is not a score, diagnosis, or placement recommendation.",
  };
}

export async function profilesForComparison(
  journeyId: string,
  profileIds: number[],
) {
  return db
    .select()
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.journeyId, journeyId),
        inArray(ministryProfilesTable.id, profileIds),
      ),
    );
}