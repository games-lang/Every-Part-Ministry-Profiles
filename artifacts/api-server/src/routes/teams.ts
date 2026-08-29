import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  CreateTeamBody,
  CreateTeamResponse,
  ListTeamsResponse,
  UpdateTeamBody,
  UpdateTeamParams,
  UpdateTeamResponse,
} from "@workspace/api-zod";
import {
  db,
  ministryProfilesTable,
  ministryTeamsTable,
} from "@workspace/db";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import { teamResponse } from "../lib/teams";

const router: IRouter = Router();

async function teamWithMembers(teamId: number, churchId: number) {
  const [team] = await db
    .select()
    .from(ministryTeamsTable)
    .where(
      and(
        eq(ministryTeamsTable.id, teamId),
        eq(ministryTeamsTable.churchId, churchId),
      ),
    )
    .limit(1);

  if (!team) return null;

  const members = await db
    .select()
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.churchId, churchId),
        eq(ministryProfilesTable.teamId, team.id),
      ),
    )
    .orderBy(asc(ministryProfilesTable.lastName), asc(ministryProfilesTable.firstName));

  return teamResponse(team, members);
}

router.get("/teams", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const church = await getOrCreateChurch(userId);
  const teams = await db
    .select()
    .from(ministryTeamsTable)
    .where(eq(ministryTeamsTable.churchId, church.id))
    .orderBy(
      asc(ministryTeamsTable.isArchived),
      asc(ministryTeamsTable.name),
    );

  const members = await db
    .select()
    .from(ministryProfilesTable)
    .where(eq(ministryProfilesTable.churchId, church.id));
  const membersByTeam = new Map<number, typeof members>();
  for (const member of members) {
    if (member.teamId === null) continue;
    const current = membersByTeam.get(member.teamId) ?? [];
    current.push(member);
    membersByTeam.set(member.teamId, current);
  }

  res.json(
    ListTeamsResponse.parse(
      teams.map((team) => teamResponse(team, membersByTeam.get(team.id) ?? [])),
    ),
  );
});

router.post("/teams", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const name = parsed.data.name.trim();
  if (!name) {
    res.status(400).json({ error: "Team name is required." });
    return;
  }

  const existingTeams = await db
    .select({ name: ministryTeamsTable.name })
    .from(ministryTeamsTable)
    .where(eq(ministryTeamsTable.churchId, church.id));
  if (existingTeams.some((team) => team.name.trim().toLowerCase() === name.toLowerCase())) {
    res.status(400).json({ error: "A team with this name already exists." });
    return;
  }

  const [created] = await db
    .insert(ministryTeamsTable)
    .values({
      churchId: church.id,
      name,
      description: parsed.data.description?.trim() || null,
    })
    .returning();
  if (!created) throw new Error("Unable to create team");

  res.status(201).json(
    CreateTeamResponse.parse(teamResponse(created, [])),
  );
});

router.patch("/teams/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const params = UpdateTeamParams.safeParse(req.params);
  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(ministryTeamsTable)
      .where(
        and(
          eq(ministryTeamsTable.id, params.data.id),
          eq(ministryTeamsTable.churchId, church.id),
        ),
      )
      .for("update")
      .limit(1);
    if (!current) return { error: "Team not found", status: 404 } as const;

    const updates: Partial<typeof ministryTeamsTable.$inferInsert> = {};
    if (parsed.data.name !== undefined) {
      const name = parsed.data.name.trim();
      if (!name) {
        return { error: "Team name is required.", status: 400 } as const;
      }
      const otherTeams = await tx
        .select({ id: ministryTeamsTable.id, name: ministryTeamsTable.name })
        .from(ministryTeamsTable)
        .where(eq(ministryTeamsTable.churchId, church.id));
      if (
        otherTeams.some(
          (team) =>
            team.id !== current.id &&
            team.name.trim().toLowerCase() === name.toLowerCase(),
        )
      ) {
        return {
          error: "A team with this name already exists.",
          status: 400,
        } as const;
      }
      updates.name = name;
    }
    if (parsed.data.description !== undefined) {
      updates.description = parsed.data.description?.trim() || null;
    }
    if (parsed.data.isArchived !== undefined) {
      updates.isArchived = parsed.data.isArchived;
    }

    const [updated] = await tx
      .update(ministryTeamsTable)
      .set(updates)
      .where(
        and(
          eq(ministryTeamsTable.id, current.id),
          eq(ministryTeamsTable.churchId, church.id),
        ),
      )
      .returning();
    if (!updated) return { error: "Team not found", status: 404 } as const;
    return { updated } as const;
  });
  if ("error" in result && typeof result.status === "number") {
    res.status(result.status).json({ error: result.error });
    return;
  }

  const response = await teamWithMembers(result.updated.id, church.id);
  if (!response) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  res.json(UpdateTeamResponse.parse(response));
});

export default router;