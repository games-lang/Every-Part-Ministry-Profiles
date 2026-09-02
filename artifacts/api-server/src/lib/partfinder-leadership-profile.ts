import {
  db,
  partFinderLeadershipProfilesTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";
export {
  leadershipProfileResponse,
  normalizeLeadershipProfile,
} from "./partfinder-leadership-profile-data";

export async function getLeadershipProfile(
  churchId: number,
  userId: string,
) {
  const [record] = await db
    .select()
    .from(partFinderLeadershipProfilesTable)
    .where(
      and(
        eq(partFinderLeadershipProfilesTable.churchId, churchId),
        eq(partFinderLeadershipProfilesTable.clerkUserId, userId),
      ),
    )
    .limit(1);
  return record;
}