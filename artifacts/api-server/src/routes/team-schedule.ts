import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  CreateTeamScheduleBody,
  CreateTeamScheduleParams,
  CreateTeamScheduleResponse,
  DeleteTeamScheduleParams,
  ListTeamScheduleParams,
  ListTeamScheduleResponse,
  ListProfileScheduleParams,
  ListProfileScheduleResponse,
  UpdateTeamScheduleBody,
  UpdateTeamScheduleParams,
  UpdateTeamScheduleResponse,
} from "@workspace/api-zod";
import {
  db,
  ministryProfilesTable,
  ministryTeamSchedulesTable,
  ministryTeamsTable,
} from "@workspace/db";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";

const router: IRouter = Router();
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function validDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validTimeRange(startTime: string, endTime: string | null): boolean {
  if (!TIME_PATTERN.test(startTime)) return false;
  if (endTime === null) return true;
  if (!TIME_PATTERN.test(endTime)) return false;
  return endTime > startTime;
}

function shiftResponse(
  shift: typeof ministryTeamSchedulesTable.$inferSelect,
  volunteerName: string | null,
) {
  return {
    id: shift.id,
    teamId: shift.teamId,
    profileId: shift.profileId,
    volunteerName,
    scheduledDate: shift.scheduledDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    role: shift.role,
    notes: shift.notes,
    isCancelled: shift.isCancelled,
    createdAt: shift.createdAt,
  };
}

async function getVolunteerName(
  profileId: number | null,
  churchId: number,
): Promise<string | null> {
  if (profileId === null) return null;
  const [profile] = await db
    .select({
      firstName: ministryProfilesTable.firstName,
      lastName: ministryProfilesTable.lastName,
    })
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.id, profileId),
        eq(ministryProfilesTable.churchId, churchId),
        eq(ministryProfilesTable.profileType, "adult"),
      ),
    )
    .limit(1);
  return profile ? `${profile.firstName} ${profile.lastName}` : null;
}

async function scheduleResponse(
  shift: typeof ministryTeamSchedulesTable.$inferSelect,
  churchId: number,
) {
  return shiftResponse(
    shift,
    await getVolunteerName(shift.profileId, churchId),
  );
}

async function teamForChurch(teamId: number, churchId: number) {
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
  return team ?? null;
}

async function assignedVolunteer(
  profileId: number | null | undefined,
  teamId: number,
  churchId: number,
) {
  if (profileId == null) return true;
  const [profile] = await db
    .select({ id: ministryProfilesTable.id })
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.id, profileId),
        eq(ministryProfilesTable.churchId, churchId),
        eq(ministryProfilesTable.teamId, teamId),
        eq(ministryProfilesTable.profileType, "adult"),
      ),
    )
    .limit(1);
  return Boolean(profile);
}

router.get("/teams/:id/schedule", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = ListTeamScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const team = await teamForChurch(params.data.id, church.id);
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  const shifts = await db
    .select()
    .from(ministryTeamSchedulesTable)
    .where(
      and(
        eq(ministryTeamSchedulesTable.teamId, team.id),
        eq(ministryTeamSchedulesTable.churchId, church.id),
      ),
    )
    .orderBy(
      asc(ministryTeamSchedulesTable.scheduledDate),
      asc(ministryTeamSchedulesTable.startTime),
    );
  res.json(
    ListTeamScheduleResponse.parse(
      await Promise.all(shifts.map((shift) => scheduleResponse(shift, church.id))),
    ),
  );
});

router.get("/profiles/:id/schedule", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = ListProfileScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const [profile] = await db
    .select({
      id: ministryProfilesTable.id,
      profileType: ministryProfilesTable.profileType,
    })
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.id, params.data.id),
        eq(ministryProfilesTable.churchId, church.id),
      ),
    )
    .limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  if (profile.profileType !== "adult") {
    res.json([]);
    return;
  }
  const shifts = await db
    .select()
    .from(ministryTeamSchedulesTable)
    .where(
      and(
        eq(ministryTeamSchedulesTable.profileId, profile.id),
        eq(ministryTeamSchedulesTable.churchId, church.id),
      ),
    )
    .orderBy(
      asc(ministryTeamSchedulesTable.scheduledDate),
      asc(ministryTeamSchedulesTable.startTime),
    );
  res.json(
    ListProfileScheduleResponse.parse(
      await Promise.all(shifts.map((shift) => scheduleResponse(shift, church.id))),
    ),
  );
});

router.post("/teams/:id/schedule", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = CreateTeamScheduleParams.safeParse(req.params);
  const parsed = CreateTeamScheduleBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const team = await teamForChurch(params.data.id, church.id);
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  if (team.isArchived) {
    res.status(400).json({ error: "Archived teams cannot receive new schedule shifts." });
    return;
  }
  const endTime = parsed.data.endTime ?? null;
  if (!validDate(parsed.data.scheduledDate) || !validTimeRange(parsed.data.startTime, endTime)) {
    res.status(400).json({ error: "Enter a valid date and time range." });
    return;
  }
  if (!(await assignedVolunteer(parsed.data.profileId, team.id, church.id))) {
    res.status(400).json({ error: "The selected volunteer is not assigned to this team." });
    return;
  }
  const [created] = await db
    .insert(ministryTeamSchedulesTable)
    .values({
      churchId: church.id,
      teamId: team.id,
      profileId: parsed.data.profileId ?? null,
      scheduledDate: parsed.data.scheduledDate,
      startTime: parsed.data.startTime,
      endTime,
      role: parsed.data.role.trim(),
      notes: parsed.data.notes?.trim() || null,
    })
    .returning();
  if (!created) throw new Error("Unable to create schedule shift");
  res
    .status(201)
    .json(CreateTeamScheduleResponse.parse(await scheduleResponse(created, church.id)));
});

router.patch("/team-schedule/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = UpdateTeamScheduleParams.safeParse(req.params);
  const parsed = UpdateTeamScheduleBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const [current] = await db
    .select()
    .from(ministryTeamSchedulesTable)
    .where(
      and(
        eq(ministryTeamSchedulesTable.id, params.data.id),
        eq(ministryTeamSchedulesTable.churchId, church.id),
      ),
    )
    .limit(1);
  if (!current) {
    res.status(404).json({ error: "Schedule shift not found" });
    return;
  }

  const scheduledDate = parsed.data.scheduledDate ?? current.scheduledDate;
  const startTime = parsed.data.startTime ?? current.startTime;
  const endTime = parsed.data.endTime === undefined ? current.endTime : parsed.data.endTime;
  const profileId = parsed.data.profileId === undefined ? current.profileId : parsed.data.profileId;
  if (!validDate(scheduledDate) || !validTimeRange(startTime, endTime)) {
    res.status(400).json({ error: "Enter a valid date and time range." });
    return;
  }
  if (!(await assignedVolunteer(profileId, current.teamId, church.id))) {
    res.status(400).json({ error: "The selected volunteer is not assigned to this team." });
    return;
  }
  const [updated] = await db
    .update(ministryTeamSchedulesTable)
    .set({
      scheduledDate,
      startTime,
      endTime,
      profileId,
      role: parsed.data.role === undefined ? current.role : parsed.data.role.trim(),
      notes: parsed.data.notes === undefined ? current.notes : parsed.data.notes?.trim() || null,
      isCancelled: parsed.data.isCancelled ?? current.isCancelled,
    })
    .where(
      and(
        eq(ministryTeamSchedulesTable.id, current.id),
        eq(ministryTeamSchedulesTable.churchId, church.id),
      ),
    )
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Schedule shift not found" });
    return;
  }
  res.json(UpdateTeamScheduleResponse.parse(await scheduleResponse(updated, church.id)));
});

router.delete("/team-schedule/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = DeleteTeamScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const [deleted] = await db
    .delete(ministryTeamSchedulesTable)
    .where(
      and(
        eq(ministryTeamSchedulesTable.id, params.data.id),
        eq(ministryTeamSchedulesTable.churchId, church.id),
      ),
    )
    .returning({ id: ministryTeamSchedulesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Schedule shift not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;