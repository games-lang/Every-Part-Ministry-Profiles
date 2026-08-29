import { db, churchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
export { activeSpiritualGifts, validateEnabledSpiritualGifts } from "./spiritual-gifts";

function slugFromUserId(userId: string): string {
  const suffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-10).toLowerCase();
  return `your-church-${suffix || "home"}`;
}

export async function getOrCreateChurch(userId: string) {
  const [existing] = await db
    .select()
    .from(churchesTable)
    .where(eq(churchesTable.ownerUserId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(churchesTable)
    .values({
      ownerUserId: userId,
      name: "Your Church",
      slug: slugFromUserId(userId),
      adminName: "Church Administrator",
      adminEmail: "admin@example.com",
    })
    .returning();

  if (!created) throw new Error("Unable to create church");
  return created;
}

export function churchResponse(
  church: Awaited<ReturnType<typeof getOrCreateChurch>>,
  completedProfileCount = 0,
) {
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
  };
}
