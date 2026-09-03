import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, gt, max } from "drizzle-orm";
import {
  AcknowledgeEarlyAccessWelcomeResponse,
  GetEarlyAccessOverviewResponse,
  GetEarlyAccessWelcomeResponse,
} from "@workspace/api-zod";
import {
  appFeedbackTable,
  churchesTable,
  db,
  earlyAccessUsageEventsTable,
  earlyAccessWelcomeAcknowledgementsTable,
  ministryPeopleTable,
  ministryProfilesTable,
  ministryTeamSchedulesTable,
  ministryTeamsTable,
} from "@workspace/db";
import { requireAppAdmin, requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";

const router: IRouter = Router();
const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const FOLLOW_UP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

router.get("/early-access/welcome", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const church = await getOrCreateChurch(userId);
  const [acknowledgement] = await db
    .select({ id: earlyAccessWelcomeAcknowledgementsTable.id })
    .from(earlyAccessWelcomeAcknowledgementsTable)
    .where(
      and(
        eq(earlyAccessWelcomeAcknowledgementsTable.churchId, church.id),
        eq(earlyAccessWelcomeAcknowledgementsTable.clerkUserId, userId),
      ),
    )
    .limit(1);

  res.setHeader("Cache-Control", "no-store");
  res.json(
    GetEarlyAccessWelcomeResponse.parse({
      show: church.earlyAccessStatus === "early_access" && !acknowledgement,
      churchName: church.name,
      earlyAccessStartDate: church.earlyAccessStartDate,
    }),
  );
});

router.post("/early-access/welcome", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const church = await getOrCreateChurch(userId);
  await db
    .insert(earlyAccessWelcomeAcknowledgementsTable)
    .values({ churchId: church.id, clerkUserId: userId })
    .onConflictDoNothing();

  res.json(AcknowledgeEarlyAccessWelcomeResponse.parse({ acknowledged: true }));
});

router.get("/admin/early-access/overview", async (req, res): Promise<void> => {
  if (!requireAppAdmin(req, res)) return;

  const churches = await db
    .select()
    .from(churchesTable)
    .where(eq(churchesTable.earlyAccessStatus, "early_access"))
    .orderBy(asc(churchesTable.name));

  const summaries = await Promise.all(
    churches.map(async (church) => {
      const [
        [peopleCount],
        [profileCount],
        [partFinderConversations],
        [partFinderSearches],
        [opportunitiesCreated],
        [matchesReviewed],
        [feedbackSubmitted],
        [latestPeople],
        [latestProfiles],
        [latestTeams],
        [latestSchedules],
        [latestUsage],
      ] = await Promise.all([
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
          .from(ministryProfilesTable)
          .where(eq(ministryProfilesTable.churchId, church.id)),
        db
          .select({ count: count() })
          .from(earlyAccessUsageEventsTable)
          .where(
            and(
              eq(earlyAccessUsageEventsTable.churchId, church.id),
              eq(earlyAccessUsageEventsTable.eventType, "partfinder_conversation"),
            ),
          ),
        db
          .select({ count: count() })
          .from(earlyAccessUsageEventsTable)
          .where(
            and(
              eq(earlyAccessUsageEventsTable.churchId, church.id),
              eq(earlyAccessUsageEventsTable.eventType, "partfinder_search"),
            ),
          ),
        db
          .select({ count: count() })
          .from(ministryTeamsTable)
          .where(
            and(
              eq(ministryTeamsTable.churchId, church.id),
              eq(ministryTeamsTable.isArchived, false),
            ),
          ),
        db
          .select({ count: count() })
          .from(ministryProfilesTable)
          .where(
            and(
              eq(ministryProfilesTable.churchId, church.id),
              gt(ministryProfilesTable.teamId, 0),
            ),
          ),
        db
          .select({ count: count() })
          .from(appFeedbackTable)
          .where(eq(appFeedbackTable.churchId, church.id)),
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

      const membersInvited = Number(peopleCount?.count ?? 0);
      const profilesCompleted = Number(profileCount?.count ?? 0);
      const completionRate = membersInvited
        ? Math.round((profilesCompleted / membersInvited) * 100)
        : 0;
      const activityDates = [
        church.updatedAt,
        latestPeople?.latest,
        latestProfiles?.latest,
        latestTeams?.latest,
        latestSchedules?.latest,
        latestUsage?.latest,
      ].filter((value): value is Date => value instanceof Date);
      const lastActivityAt = activityDates.length
        ? new Date(Math.max(...activityDates.map((value) => value.getTime())))
        : null;
      const age = lastActivityAt ? Date.now() - lastActivityAt.getTime() : Infinity;
      const health =
        age === Infinity || age >= 30 * 24 * 60 * 60 * 1000
          ? "needs-follow-up"
          : age >= FOLLOW_UP_WINDOW_MS
            ? "low-activity"
            : profilesCompleted >= 10 || Number(partFinderConversations?.count ?? 0) >= 5
              ? "highly-active"
              : "active";

      return {
        id: church.id,
        name: church.name,
        earlyAccessStartDate: church.earlyAccessStartDate,
        membersInvited,
        profilesCompleted,
        completionRate,
        partFinderConversations: Number(partFinderConversations?.count ?? 0),
        partFinderSearches: Number(partFinderSearches?.count ?? 0),
        opportunitiesCreated: Number(opportunitiesCreated?.count ?? 0),
        matchesReviewed: Number(matchesReviewed?.count ?? 0),
        feedbackSubmitted: Number(feedbackSubmitted?.count ?? 0),
        lastActivityAt,
        health,
      };
    }),
  );

  const profilesStarted = summaries.reduce((total, item) => total + item.membersInvited, 0);
  const profilesCompleted = summaries.reduce((total, item) => total + item.profilesCompleted, 0);
  const activeChurches = summaries.filter((item) => {
    if (!item.lastActivityAt) return false;
    return Date.now() - item.lastActivityAt.getTime() < ACTIVE_WINDOW_MS;
  }).length;

  res.setHeader("Cache-Control", "no-store");
  res.json(
    GetEarlyAccessOverviewResponse.parse({
      totalEarlyAccessChurches: summaries.length,
      activeChurches,
      inactiveSevenDays: summaries.filter(
        (item) =>
          !item.lastActivityAt ||
          Date.now() - item.lastActivityAt.getTime() >= FOLLOW_UP_WINDOW_MS,
      ).length,
      profilesStarted,
      profilesCompleted,
      averageCompletionRate: profilesStarted
        ? Math.round((profilesCompleted / profilesStarted) * 100)
        : 0,
      partFinderConversations: summaries.reduce(
        (total, item) => total + item.partFinderConversations,
        0,
      ),
      partFinderSearches: summaries.reduce(
        (total, item) => total + item.partFinderSearches,
        0,
      ),
      opportunitiesCreated: summaries.reduce(
        (total, item) => total + item.opportunitiesCreated,
        0,
      ),
      matchesReviewed: summaries.reduce(
        (total, item) => total + item.matchesReviewed,
        0,
      ),
      feedbackSubmitted: summaries.reduce(
        (total, item) => total + item.feedbackSubmitted,
        0,
      ),
      churches: summaries,
    }),
  );
});

export default router;