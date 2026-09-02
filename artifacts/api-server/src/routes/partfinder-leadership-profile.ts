import { Router, type IRouter } from "express";
import {
  GetPartFinderLeadershipProfileResponse,
  UpdatePartFinderLeadershipProfileBody,
  UpdatePartFinderLeadershipProfileResponse,
} from "@workspace/api-zod";
import { db, partFinderLeadershipProfilesTable } from "@workspace/db";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import {
  getLeadershipProfile,
  leadershipProfileResponse,
  normalizeLeadershipProfile,
} from "../lib/partfinder-leadership-profile";

const router: IRouter = Router();

router.get("/partfinder/leadership-profile", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  res.setHeader("Cache-Control", "no-store");

  const church = await getOrCreateChurch(userId);
  const record = await getLeadershipProfile(church.id, userId);
  res.json(
    GetPartFinderLeadershipProfileResponse.parse(
      leadershipProfileResponse(record),
    ),
  );
});

router.put("/partfinder/leadership-profile", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  res.setHeader("Cache-Control", "no-store");

  const parsed = UpdatePartFinderLeadershipProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please review your leadership profile." });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const {
    personalizationEnabled,
    ...leadershipProfile
  } = parsed.data;
  const profile = normalizeLeadershipProfile(leadershipProfile);
  const now = new Date();
  const [updated] = await db
    .insert(partFinderLeadershipProfilesTable)
    .values({
      churchId: church.id,
      clerkUserId: userId,
      profile,
      personalizationEnabled,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        partFinderLeadershipProfilesTable.churchId,
        partFinderLeadershipProfilesTable.clerkUserId,
      ],
      set: {
        profile,
        personalizationEnabled,
        updatedAt: now,
      },
    })
    .returning();

  if (!updated) {
    res.status(500).json({ error: "Unable to save your leadership profile." });
    return;
  }

  res.json(
    UpdatePartFinderLeadershipProfileResponse.parse(
      leadershipProfileResponse(updated),
    ),
  );
});

export default router;