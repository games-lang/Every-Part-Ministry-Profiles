import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  CompareJourneyProfilesParams,
  CompareJourneyProfilesResponse,
  CreateJourneyEntryBody,
  CreateJourneyEntryParams,
  CreateJourneyEntryResponse,
  GetProfileJourneyParams,
  GetProfileJourneyResponse,
  GetPublicJourneyParams,
  GetPublicJourneyResponse,
  UpdateJourneyEntryBody,
  UpdateJourneyEntryParams,
  UpdateJourneyEntryResponse,
} from "@workspace/api-zod";
import {
  db,
  ministryJourneyEntriesTable,
  ministryJourneysTable,
  ministryProfilesTable,
} from "@workspace/db";
import { getOrCreateChurch } from "../lib/churches";
import { requireUserId } from "../lib/auth";
import {
  compareProfiles,
  ensureJourneyForProfile,
  journeyEntries,
  journeyForAccessToken,
  journeyProfiles,
  profilesForComparison,
  publicJourneyResponse,
} from "../lib/ministry-journeys";

const router: IRouter = Router();

router.get("/journeys/:token", async (req, res): Promise<void> => {
  const parsed = GetPublicJourneyParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  const journey = await journeyForAccessToken(parsed.data.token);
  if (!journey) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  const [profiles, entries] = await Promise.all([
    journeyProfiles(journey.id),
    journeyEntries(journey.id),
  ]);
  res.json(GetPublicJourneyResponse.parse(publicJourneyResponse(journey, profiles, entries)));
});

router.get("/profiles/:id/journey", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const parsed = GetProfileJourneyParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const [profile] = await db
    .select()
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.id, parsed.data.id),
        eq(ministryProfilesTable.churchId, church.id),
      ),
    )
    .limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  const journey = await ensureJourneyForProfile(profile);
  const [profiles, entries] = await Promise.all([
    journeyProfiles(journey.id),
    journeyEntries(journey.id),
  ]);
  res.json(GetProfileJourneyResponse.parse(publicJourneyResponse(journey, profiles, entries)));
});

router.post("/journeys/:token/entries", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = CreateJourneyEntryParams.safeParse(req.params);
  const parsed = CreateJourneyEntryBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: !params.success
        ? params.error.message
        : parsed.success
          ? "Invalid entry"
          : parsed.error.message,
    });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const journey = await journeyForAccessToken(params.data.token);
  if (!journey || journey.churchId !== church.id) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  const [entry] = await db
    .insert(ministryJourneyEntriesTable)
    .values({
      journeyId: journey.id,
      entryType: parsed.data.entryType,
      occurredAt: parsed.data.occurredAt.toISOString().slice(0, 10),
      title: parsed.data.title,
      description: parsed.data.description,
      ministryArea: parsed.data.ministryArea ?? null,
      author: parsed.data.author,
      reflection: parsed.data.reflection ?? null,
    })
    .returning();
  if (!entry) throw new Error("Unable to create journey entry");
  res.status(201).json(CreateJourneyEntryResponse.parse(entry));
});

router.patch("/journeys/entries/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = UpdateJourneyEntryParams.safeParse(req.params);
  const parsed = UpdateJourneyEntryBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: !params.success
        ? params.error.message
        : parsed.success
          ? "Invalid entry"
          : parsed.error.message,
    });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const [entry] = await db
    .select()
    .from(ministryJourneyEntriesTable)
    .where(eq(ministryJourneyEntriesTable.id, params.data.id))
    .limit(1);
  if (!entry) {
    res.status(404).json({ error: "Journey entry not found" });
    return;
  }
  const [journey] = await db
    .select()
    .from(ministryJourneysTable)
    .where(
      and(
        eq(ministryJourneysTable.id, entry.journeyId),
        eq(ministryJourneysTable.churchId, church.id),
      ),
    )
    .limit(1);
  if (!journey) {
    res.status(404).json({ error: "Journey entry not found" });
    return;
  }
  const [updated] = await db
    .update(ministryJourneyEntriesTable)
    .set({ reflection: parsed.data.reflection ?? null })
    .where(eq(ministryJourneyEntriesTable.id, entry.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Journey entry not found" });
    return;
  }
  res.json(UpdateJourneyEntryResponse.parse(updated));
});

router.get(
  "/journeys/:token/compare/:leftProfileId/:rightProfileId",
  async (req, res): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const parsed = CompareJourneyProfilesParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const church = await getOrCreateChurch(userId);
    const journey = await journeyForAccessToken(parsed.data.token);
    if (!journey || journey.churchId !== church.id) {
      res.status(404).json({ error: "Journey not found" });
      return;
    }
    if (parsed.data.leftProfileId === parsed.data.rightProfileId) {
      res.status(400).json({ error: "Choose two different profiles to compare." });
      return;
    }
    const profiles = await profilesForComparison(journey.id, [
      parsed.data.leftProfileId,
      parsed.data.rightProfileId,
    ]);
    const left = profiles.find((profile) => profile.id === parsed.data.leftProfileId);
    const right = profiles.find((profile) => profile.id === parsed.data.rightProfileId);
    if (!left || !right) {
      res.status(404).json({ error: "Profile not found in this journey" });
      return;
    }
    res.json(CompareJourneyProfilesResponse.parse(compareProfiles(left, right)));
  },
);

export default router;