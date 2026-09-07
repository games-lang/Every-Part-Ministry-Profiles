import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  GetDiscoverResultParams,
  GetDiscoverResultResponse,
  SubmitDiscoverProfileBody,
  SubmitDiscoverProfileResponse,
  GetExploreResultParams,
  GetExploreResultResponse,
  SubmitExploreProfileBody,
  SubmitExploreProfileResponse,
  GetDevelopResultParams,
  GetDevelopResultResponse,
  SubmitDevelopProfileBody,
  SubmitDevelopProfileResponse,
} from "@workspace/api-zod";
import {
  churchAdminsTable,
  churchesTable,
  db,
  ministryProfilesTable,
} from "@workspace/db";
import {
  discoverSubmissionSchema,
  exploreResultSummary,
  exploreSubmissionSchema,
  developResultSummary,
  developSubmissionSchema,
  pathwayForAge,
  pathwayOverrideRequired,
  youthResultSummary,
  isDiscoverHallwayCode,
  matchesDiscoverHallwayCode,
} from "../lib/youth-profiles";
import {
  getOrCreateJourney,
  updateJourneyAfterProfile,
} from "../lib/ministry-journeys";
import {
  assertProfileCapacity,
  ProfileLimitReachedError,
} from "../lib/profile-limits";
import { ObjectStorageService } from "../lib/objectStorage";
import { churchBranding } from "../lib/churches";

const router: IRouter = Router();
const storage = new ObjectStorageService();

async function brandingForChurch(churchId: number) {
  const [church] = await db
    .select()
    .from(churchesTable)
    .where(eq(churchesTable.id, churchId))
    .limit(1);
  return church ? churchBranding(church) : null;
}

async function createYouthProfileWithinLimit(
  churchId: number,
  values: Omit<typeof ministryProfilesTable.$inferInsert, "churchId">,
) {
  return db.transaction(async (tx) => {
    await assertProfileCapacity(tx, churchId);
    const [created] = await tx
      .insert(ministryProfilesTable)
      .values({ ...values, churchId })
      .returning();
    if (!created) throw new Error("Unable to submit youth profile");
    return created;
  });
}

function respondToProfileLimit(
  error: unknown,
  res: Parameters<Parameters<typeof router.post>[1]>[1],
) {
  if (!(error instanceof ProfileLimitReachedError)) return false;
  res.status(403).json({ error: error.message });
  return true;
}

function optionalUserId(req: Parameters<typeof getAuth>[0]): string | null {
  const auth = getAuth(req);
  return (auth.sessionClaims?.userId as string | undefined) ?? auth.userId ?? null;
}

router.post("/youth-profiles", async (req, res): Promise<void> => {
  const userId = optionalUserId(req);
  if (!userId && !isDiscoverHallwayCode(req.body?.hallwayCode)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
}

  // Use both generated boundary validation and the stricter server-owned
  // allowlist. The generated schema deliberately cannot express every nested
  // youth answer constraint.
  const generated = SubmitDiscoverProfileBody.safeParse(req.body);
  const parsed = discoverSubmissionSchema.safeParse(req.body);
  if (!generated.success || !parsed.success) {
    res.status(400).json({
      error: !parsed.success
        ? parsed.error.message
        : generated.error?.message ?? "Invalid youth profile",
    });
    return;
  }
  const [church] = await db.select().from(churchesTable)
    .where(eq(churchesTable.slug, parsed.data.churchSlug)).limit(1);
  if (!church) {
    res.status(404).json({ error: "Church not found" });
    return;
  }
  if (generated.data.profilePhotoPath) {
    try {
      await storage.validateProfilePhoto(generated.data.profilePhotoPath, church.id);
    } catch (error) {
      res.status(400).json({ error: `Profile photo is invalid: ${error instanceof Error ? error.message : "unknown error"}` });
      return;
    }
  }
  if (!userId && !matchesDiscoverHallwayCode(church.discoverHallwayCode, parsed.data.hallwayCode)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const recommended = pathwayForAge(parsed.data.age);
  let overridden = false;
  if (pathwayOverrideRequired("discover", recommended)) {
    if (!userId || recommended === "adult") {
      res.status(400).json({ error: "This age belongs on a different pathway." });
      return;
    }
    const [membership] = await db.select({ id: churchAdminsTable.id })
      .from(churchAdminsTable)
      .where(and(eq(churchAdminsTable.churchId, church.id), eq(churchAdminsTable.clerkUserId, userId)))
      .limit(1);
    if (!membership) {
      res.status(400).json({ error: "This age belongs on a different pathway." });
      return;
    }
    overridden = true;
  }

  let journey;
  try {
    journey = await getOrCreateJourney(
      church.id,
      generated.data.journeyToken ?? undefined,
      recommended,
    );
  } catch {
    res.status(400).json({ error: "The journey link is invalid or no longer available." });
    return;
  }
  let created;
  try {
    created = await createYouthProfileWithinLimit(church.id, {
    journeyId: journey.id,
    personKey: journey.accessToken,
    firstName: parsed.data.child.firstName,
    lastName: parsed.data.child.lastName,
    // The legacy adult-required email column only carries the guardian email
    // for youth records; guardian data remains in its own explicit columns.
    email: parsed.data.guardian.email,
    passions: [],
    interests: [],
    availability: [],
    profileType: "discover",
    recommendedProfileType: recommended,
    profileTypeOverridden: overridden,
    age: parsed.data.age,
    birthdate: parsed.data.birthdate ?? null,
    youthResponses: parsed.data.answers,
    guardianObservations: parsed.data.guardianObservations ?? null,
    guardianName: parsed.data.guardian.name,
    guardianEmail: parsed.data.guardian.email,
    guardianConsent: true,
    resultExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    profilePhotoPath: generated.data.profilePhotoPath ?? null,
    });
  } catch (error) {
    if (respondToProfileLimit(error, res)) return;
    throw error;
  }
  await updateJourneyAfterProfile(created.journeyId!, created.profileType, created.completedAt);
  res.status(201).json(SubmitDiscoverProfileResponse.parse({
    resultToken: created.resultToken,
    journeyToken: journey.accessToken,
    profileType: "discover",
    recommendedProfileType: recommended,
  }));
});

router.get("/youth-profiles/:id/result", async (req, res): Promise<void> => {
  const params = GetDiscoverResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const [profile] = await db.select().from(ministryProfilesTable)
    .where(and(eq(ministryProfilesTable.resultToken, params.data.id), eq(ministryProfilesTable.profileType, "discover")))
    .limit(1);
  if (!profile || !profile.resultExpiresAt || profile.resultExpiresAt <= new Date()) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const parsedAnswers = discoverSubmissionSchema.shape.answers.safeParse(profile.youthResponses);
  if (!parsedAnswers.success || !profile.guardianName || profile.guardianConsent !== true) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const branding = await brandingForChurch(profile.churchId);
  if (!branding) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  res.json(GetDiscoverResultResponse.parse({
    branding,
    profileType: "discover",
    journeyToken: profile.personKey,
    childName: profile.firstName,
    summary: youthResultSummary(parsedAnswers.data),
    guardian: { name: profile.guardianName, consent: true },
  }));
});

router.post("/explore-profiles", async (req, res): Promise<void> => {
  const userId = optionalUserId(req);
  let authorizedHallwayChurch: typeof churchesTable.$inferSelect | undefined;
  if (!userId) {
    const churchSlug =
      typeof req.body?.churchSlug === "string" ? req.body.churchSlug.trim() : "";
    if (!churchSlug || !isDiscoverHallwayCode(req.body?.hallwayCode)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [church] = await db.select().from(churchesTable)
      .where(eq(churchesTable.slug, churchSlug)).limit(1);
    if (!church || !matchesDiscoverHallwayCode(church.discoverHallwayCode, req.body.hallwayCode)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    authorizedHallwayChurch = church;
  }

  const generated = SubmitExploreProfileBody.safeParse(req.body);
  const parsed = exploreSubmissionSchema.safeParse(req.body);
  if (!generated.success || !parsed.success) {
    res.status(400).json({
      error: !parsed.success
        ? parsed.error.message
        : generated.error?.message ?? "Invalid Explore profile",
    });
    return;
  }
  const [church] = authorizedHallwayChurch
    ? [authorizedHallwayChurch]
    : await db.select().from(churchesTable)
      .where(eq(churchesTable.slug, parsed.data.churchSlug)).limit(1);
  if (!church) {
    res.status(404).json({ error: "Church not found" });
    return;
  }
  if (generated.data.profilePhotoPath) {
    try {
      await storage.validateProfilePhoto(generated.data.profilePhotoPath, church.id);
    } catch (error) {
      res.status(400).json({ error: `Profile photo is invalid: ${error instanceof Error ? error.message : "unknown error"}` });
      return;
    }
  }

  const recommended = pathwayForAge(parsed.data.age);
  let overridden = false;
  if (pathwayOverrideRequired("explore", recommended)) {
    if (!userId || recommended === "adult") {
      res.status(400).json({ error: "This age belongs on a different pathway." });
      return;
    }
    const [membership] = await db.select({ id: churchAdminsTable.id })
      .from(churchAdminsTable)
      .where(and(eq(churchAdminsTable.churchId, church.id), eq(churchAdminsTable.clerkUserId, userId)))
      .limit(1);
    if (!membership) {
      res.status(400).json({ error: "This age belongs on a different pathway." });
      return;
    }
    overridden = true;
  }

  let journey;
  try {
    journey = await getOrCreateJourney(
      church.id,
      generated.data.journeyToken ?? undefined,
      recommended,
    );
  } catch {
    res.status(400).json({ error: "The journey link is invalid or no longer available." });
    return;
  }
  let created;
  try {
    created = await createYouthProfileWithinLimit(church.id, {
    journeyId: journey.id,
    personKey: journey.accessToken,
    firstName: parsed.data.child.firstName,
    lastName: parsed.data.child.lastName,
    email: parsed.data.guardian.email,
    passions: [],
    interests: [],
    availability: [],
    profileType: "explore",
    recommendedProfileType: recommended,
    profileTypeOverridden: overridden,
    age: parsed.data.age,
    birthdate: parsed.data.birthdate ?? null,
    youthResponses: parsed.data.answers,
    guardianObservations: parsed.data.guardianObservations ?? null,
    guardianName: parsed.data.guardian.name,
    guardianEmail: parsed.data.guardian.email,
    guardianConsent: true,
    resultExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    profilePhotoPath: generated.data.profilePhotoPath ?? null,
    });
  } catch (error) {
    if (respondToProfileLimit(error, res)) return;
    throw error;
  }
  await updateJourneyAfterProfile(created.journeyId!, created.profileType, created.completedAt);
  res.status(201).json(SubmitExploreProfileResponse.parse({
    resultToken: created.resultToken,
    journeyToken: journey.accessToken,
    profileType: "explore",
    recommendedProfileType: recommended,
  }));
});

router.get("/explore-profiles/:id/result", async (req, res): Promise<void> => {
  const params = GetExploreResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const [profile] = await db.select().from(ministryProfilesTable)
    .where(and(eq(ministryProfilesTable.resultToken, params.data.id), eq(ministryProfilesTable.profileType, "explore")))
    .limit(1);
  if (!profile || !profile.resultExpiresAt || profile.resultExpiresAt <= new Date()) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const parsedAnswers = exploreSubmissionSchema.shape.answers.safeParse(profile.youthResponses);
  if (!parsedAnswers.success || !profile.guardianName || profile.guardianConsent !== true) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const branding = await brandingForChurch(profile.churchId);
  if (!branding) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const result = exploreResultSummary(parsedAnswers.data);
  res.json(GetExploreResultResponse.parse({
    branding,
    profileType: "explore",
    journeyToken: profile.personKey,
    childName: profile.firstName,
    summary: {
      headline: result.headline,
      strengths: result.strengths,
      tendencySummary: result.tendencySummary,
      completionCopy: result.completionCopy,
    },
    suggestions: result.suggestions,
    guardian: { name: profile.guardianName, consent: true },
  }));
});

router.post("/develop-profiles", async (req, res): Promise<void> => {
  const generated = SubmitDevelopProfileBody.safeParse(req.body);
  const parsed = developSubmissionSchema.safeParse(req.body);
  if (!generated.success || !parsed.success) {
    res.status(400).json({
      error: !parsed.success
        ? parsed.error.message
        : generated.error?.message ?? "Invalid Develop profile",
    });
    return;
  }
  const [church] = await db.select().from(churchesTable)
    .where(eq(churchesTable.slug, parsed.data.churchSlug)).limit(1);
  if (!church) {
    res.status(404).json({ error: "Church not found" });
    return;
  }
  if (generated.data.profilePhotoPath) {
    try {
      await storage.validateProfilePhoto(generated.data.profilePhotoPath, church.id);
    } catch (error) {
      res.status(400).json({ error: `Profile photo is invalid: ${error instanceof Error ? error.message : "unknown error"}` });
      return;
    }
  }

  const recommended = pathwayForAge(parsed.data.age);
  let overridden = false;
  if (pathwayOverrideRequired("develop", recommended)) {
    const userId = optionalUserId(req);
    if (!userId || recommended === "adult") {
      res.status(400).json({ error: "This age belongs on a different pathway." });
      return;
    }
    const [membership] = await db.select({ id: churchAdminsTable.id })
      .from(churchAdminsTable)
      .where(and(eq(churchAdminsTable.churchId, church.id), eq(churchAdminsTable.clerkUserId, userId)))
      .limit(1);
    if (!membership) {
      res.status(400).json({ error: "This age belongs on a different pathway." });
      return;
    }
    overridden = true;
  }

  let journey;
  try {
    journey = await getOrCreateJourney(
      church.id,
      generated.data.journeyToken ?? undefined,
      recommended,
    );
  } catch {
    res.status(400).json({ error: "The journey link is invalid or no longer available." });
    return;
  }
  let created;
  try {
    created = await createYouthProfileWithinLimit(church.id, {
    journeyId: journey.id,
    personKey: journey.accessToken,
    firstName: parsed.data.child.firstName,
    lastName: parsed.data.child.lastName,
    email: parsed.data.guardian.email,
    passions: [],
    interests: [],
    availability: [],
    profileType: "develop",
    recommendedProfileType: recommended,
    profileTypeOverridden: overridden,
    age: parsed.data.age,
    birthdate: parsed.data.birthdate ?? null,
    youthResponses: parsed.data.answers,
    guardianObservations: parsed.data.guardianObservations ?? null,
    guardianName: parsed.data.guardian.name,
    guardianEmail: parsed.data.guardian.email,
    guardianConsent: true,
    resultExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    profilePhotoPath: generated.data.profilePhotoPath ?? null,
    });
  } catch (error) {
    if (respondToProfileLimit(error, res)) return;
    throw error;
  }
  await updateJourneyAfterProfile(created.journeyId!, created.profileType, created.completedAt);
  res.status(201).json(SubmitDevelopProfileResponse.parse({
    resultToken: created.resultToken,
    journeyToken: journey.accessToken,
    profileType: "develop",
    recommendedProfileType: recommended,
  }));
});

router.get("/develop-profiles/:id/result", async (req, res): Promise<void> => {
  const params = GetDevelopResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const [profile] = await db.select().from(ministryProfilesTable)
    .where(and(eq(ministryProfilesTable.resultToken, params.data.id), eq(ministryProfilesTable.profileType, "develop")))
    .limit(1);
  if (!profile || !profile.resultExpiresAt || profile.resultExpiresAt <= new Date()) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const parsedAnswers = developSubmissionSchema.shape.answers.safeParse(profile.youthResponses);
  if (!parsedAnswers.success || !profile.guardianName || profile.guardianConsent !== true) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const branding = await brandingForChurch(profile.churchId);
  if (!branding) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const result = developResultSummary(parsedAnswers.data);
  res.json(GetDevelopResultResponse.parse({
    branding,
    profileType: "develop",
    journeyToken: profile.personKey,
    childName: profile.firstName,
    summary: result,
    guardian: { name: profile.guardianName, consent: true },
  }));
});

export default router;