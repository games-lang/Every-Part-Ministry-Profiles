import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { db, ministryProfilesTable, ministryTeamsTable } from "@workspace/db";
import { requireUserId } from "../lib/auth";
import { churchResponse, getOrCreateChurch } from "../lib/churches";
import { profileListItem } from "../lib/profiles";

const router: IRouter = Router();

function counts(values: string[][]) {
  const totals = new Map<string, number>();
  values.flat().forEach((value) => {
    totals.set(value, (totals.get(value) ?? 0) + 1);
  });

  return [...totals.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  res.setHeader("Cache-Control", "no-store");

  const church = await getOrCreateChurch(userId);
  const profiles = await db
    .select()
    .from(ministryProfilesTable)
    .where(eq(ministryProfilesTable.churchId, church.id))
    .orderBy(desc(ministryProfilesTable.completedAt));
  const teams = await db
    .select()
    .from(ministryTeamsTable)
    .where(eq(ministryTeamsTable.churchId, church.id));

  res.json(
    GetDashboardSummaryResponse.parse({
      church: churchResponse(church, profiles.length),
      totalProfiles: profiles.length,
      recentProfiles: profiles.slice(0, 5).map(profileListItem),
      topInterests: counts(profiles.map((profile) => profile.interests)),
      topPassions: counts(profiles.map((profile) => profile.passions)),
      teamCount: teams.length,
      activeTeamCount: teams.filter((team) => !team.isArchived).length,
      assignedProfileCount: profiles.filter((profile) => profile.teamId !== null).length,
    }),
  );
});

export default router;
