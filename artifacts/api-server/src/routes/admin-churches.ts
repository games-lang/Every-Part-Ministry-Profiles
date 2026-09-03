import { Router, type IRouter } from "express";
import { and, asc, count, eq, ilike, max, or } from "drizzle-orm";
import {
  GetAdminChurchResponse,
  GetAdminChurchesResponse,
  UpdateAdminChurchBody,
  UpdateAdminChurchResponse,
} from "@workspace/api-zod";
import {
  churchAdminsTable,
  churchesTable,
  db,
  earlyAccessUsageEventsTable,
  ministryPeopleTable,
  ministryProfilesTable,
  ministryTeamSchedulesTable,
  ministryTeamsTable,
} from "@workspace/db";
import { requireAppAdmin } from "../lib/auth";

const router: IRouter = Router();
const statuses = new Set(["early_access", "standard"]);
const billingPlans = new Set(["starter", "growing", "complete", "network", "unlimited"]);

function positiveId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function queryValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function churchSummary(church: typeof churchesTable.$inferSelect) {
  const [
    [profileCount],
    [peopleCount],
    [adminCount],
    [latestChurch],
    [latestPeople],
    [latestProfiles],
    [latestTeams],
    [latestSchedules],
    [latestUsage],
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(ministryProfilesTable)
      .where(eq(ministryProfilesTable.churchId, church.id)),
    db
      .select({ count: count() })
      .from(ministryPeopleTable)
      .where(
        and(
          eq(ministryPeopleTable.churchId, church.id),
          eq(ministryPeopleTable.isArchived, false),
        ),
      ),
    db
      .select({ count: count() })
      .from(churchAdminsTable)
      .where(eq(churchAdminsTable.churchId, church.id)),
    db
      .select({ latest: max(churchesTable.updatedAt) })
      .from(churchesTable)
      .where(eq(churchesTable.id, church.id)),
    db
      .select({ latest: max(ministryPeopleTable.updatedAt) })
      .from(ministryPeopleTable)
      .where(eq(ministryPeopleTable.churchId, church.id)),
    db
      .select({ latest: max(ministryProfilesTable.completedAt) })
      .from(ministryProfilesTable)
      .where(eq(ministryProfilesTable.churchId, church.id)),
    db
      .select({ latest: max(ministryTeamsTable.updatedAt) })
      .from(ministryTeamsTable)
      .where(eq(ministryTeamsTable.churchId, church.id)),
    db
      .select({ latest: max(ministryTeamSchedulesTable.updatedAt) })
      .from(ministryTeamSchedulesTable)
      .where(eq(ministryTeamSchedulesTable.churchId, church.id)),
    db
      .select({ latest: max(earlyAccessUsageEventsTable.createdAt) })
      .from(earlyAccessUsageEventsTable)
      .where(eq(earlyAccessUsageEventsTable.churchId, church.id)),
  ]);

  const activityDates = [
    latestChurch?.latest,
    latestPeople?.latest,
    latestProfiles?.latest,
    latestTeams?.latest,
    latestSchedules?.latest,
    latestUsage?.latest,
  ].filter((value): value is Date => value instanceof Date);

  return {
    id: church.id,
    name: church.name,
    slug: church.slug,
    address: church.address,
    website: church.website,
    adminName: church.adminName,
    adminEmail: church.adminEmail,
    earlyAccessStatus: church.earlyAccessStatus,
    earlyAccessStartDate: church.earlyAccessStartDate,
    foundingChurch: church.foundingChurch,
    billingPlan: church.billingPlan,
    billingStatus: church.billingStatus,
    billingCurrentPeriodEnd: church.billingCurrentPeriodEnd,
    completedProfileCount: Number(profileCount?.count ?? 0),
    activePeopleCount: Number(peopleCount?.count ?? 0),
    adminCount: Number(adminCount?.count ?? 0),
    lastActivityAt: activityDates.length
      ? new Date(Math.max(...activityDates.map((value) => value.getTime())))
      : null,
    createdAt: church.createdAt,
    updatedAt: church.updatedAt,
  };
}

async function churchDetail(church: typeof churchesTable.$inferSelect) {
  const [summary, admins] = await Promise.all([
    churchSummary(church),
    db
      .select()
      .from(churchAdminsTable)
      .where(eq(churchAdminsTable.churchId, church.id))
      .orderBy(asc(churchAdminsTable.role), asc(churchAdminsTable.name)),
  ]);

  return {
    church: summary,
    admins: admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
    })),
  };
}

router.get("/admin/churches", async (req, res): Promise<void> => {
  if (!requireAppAdmin(req, res)) return;

  const search = queryValue(req.query.search);
  const status = queryValue(req.query.status);
  const billingPlan = queryValue(req.query.billingPlan);
  if (status && !statuses.has(status)) {
    res.status(400).json({ error: "Invalid church status." });
    return;
  }
  if (billingPlan && !billingPlans.has(billingPlan)) {
    res.status(400).json({ error: "Invalid billing plan." });
    return;
  }

  const filters = [];
  if (search) {
    const pattern = `%${search}%`;
    filters.push(
      or(
        ilike(churchesTable.name, pattern),
        ilike(churchesTable.slug, pattern),
        ilike(churchesTable.adminName, pattern),
        ilike(churchesTable.adminEmail, pattern),
      ),
    );
  }
  if (status) filters.push(eq(churchesTable.earlyAccessStatus, status));
  if (billingPlan) filters.push(eq(churchesTable.billingPlan, billingPlan));

  const churches = await db
    .select()
    .from(churchesTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(churchesTable.name));
  const items = await Promise.all(churches.map(churchSummary));

  res.setHeader("Cache-Control", "no-store");
  res.json(GetAdminChurchesResponse.parse({ items }));
});

router.get("/admin/churches/:id", async (req, res): Promise<void> => {
  if (!requireAppAdmin(req, res)) return;

  const id = positiveId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Church id must be a positive integer." });
    return;
  }
  const [church] = await db
    .select()
    .from(churchesTable)
    .where(eq(churchesTable.id, id))
    .limit(1);
  if (!church) {
    res.status(404).json({ error: "Church not found." });
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.json(GetAdminChurchResponse.parse(await churchDetail(church)));
});

router.patch("/admin/churches/:id", async (req, res): Promise<void> => {
  if (!requireAppAdmin(req, res)) return;

  const id = positiveId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Church id must be a positive integer." });
    return;
  }
  const parsed = UpdateAdminChurchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<typeof churchesTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
  if (parsed.data.address !== undefined) updates.address = parsed.data.address?.trim() || null;
  if (parsed.data.website !== undefined) updates.website = parsed.data.website?.trim() || null;
  if (parsed.data.adminName !== undefined) updates.adminName = parsed.data.adminName.trim();
  if (parsed.data.adminEmail !== undefined) updates.adminEmail = parsed.data.adminEmail.trim().toLowerCase();
  if (parsed.data.earlyAccessStatus !== undefined) updates.earlyAccessStatus = parsed.data.earlyAccessStatus;
  if (parsed.data.foundingChurch !== undefined) updates.foundingChurch = parsed.data.foundingChurch;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Provide at least one church field to update." });
    return;
  }

  const [updated] = await db
    .update(churchesTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(churchesTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Church not found." });
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.json(UpdateAdminChurchResponse.parse(await churchDetail(updated)));
});

export default router;