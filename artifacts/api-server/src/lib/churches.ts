import {
  churchAdminsTable,
  churchesTable,
  db,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  assessmentConfiguration,
  defaultAssessmentConfiguration,
} from "./assessment-configuration";
import {
  defaultMinistryCustomization,
  ministryCustomization,
} from "./ministry-customization";
export { activeSpiritualGifts, validateEnabledSpiritualGifts } from "./spiritual-gifts";

function slugFromUserId(userId: string): string {
  const suffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-10).toLowerCase();
  return `your-church-${suffix || "home"}`;
}

export async function getOrCreateChurch(userId: string) {
  const [membership] = await db
    .select({ church: churchesTable })
    .from(churchAdminsTable)
    .innerJoin(churchesTable, eq(churchAdminsTable.churchId, churchesTable.id))
    .where(eq(churchAdminsTable.clerkUserId, userId))
    .limit(1);
  if (membership?.church) return membership.church;

  const [existing] = await db
    .select()
    .from(churchesTable)
    .where(eq(churchesTable.ownerUserId, userId))
    .limit(1);

  if (existing) {
    await db
      .insert(churchAdminsTable)
      .values({
        churchId: existing.id,
        clerkUserId: userId,
        email: existing.adminEmail,
        name: existing.adminName,
        role: "owner",
      })
      .onConflictDoNothing();
    return existing;
  }

  const [created] = await db.transaction(async (tx) => {
    const [church] = await tx
      .insert(churchesTable)
      .values({
        ownerUserId: userId,
        name: "Your Church",
        slug: slugFromUserId(userId),
        adminName: "Church Administrator",
        adminEmail: "admin@example.com",
        foundingChurch: true,
      })
      .returning();
    if (church) {
      await tx.insert(churchAdminsTable).values({
        churchId: church.id,
        clerkUserId: userId,
        email: church.adminEmail,
        name: church.adminName,
        role: "owner",
      });
    }
    return [church] as const;
  });

  if (!created) throw new Error("Unable to create church");
  return created;
}

export function churchResponse(
  church: Awaited<ReturnType<typeof getOrCreateChurch>>,
  completedProfileCount = 0,
) {
  const configuration =
    assessmentConfiguration(church.assessmentConfiguration) ??
    defaultAssessmentConfiguration();
  const customization =
    ministryCustomization(church.ministryCustomization) ??
    defaultMinistryCustomization();
  return {
    id: church.id,
    name: church.name,
    slug: church.slug,
    logoUrl: church.logoUrl,
    primaryColor: church.primaryColor,
    accentColor: church.accentColor,
    address: church.address,
    website: church.website,
    adminName: church.adminName,
    adminEmail: church.adminEmail,
    profileUrl: `/profile/${church.slug}`,
    completedProfileCount,
    enabledSpiritualGifts: church.enabledSpiritualGifts,
    assessmentConfiguration: configuration,
    ministryCustomization: customization,
    onboardingCompletedAt: church.onboardingCompletedAt,
    earlyAccessStatus: church.earlyAccessStatus,
    earlyAccessStartDate: church.earlyAccessStartDate,
    foundingChurch: church.foundingChurch,
  };
}
