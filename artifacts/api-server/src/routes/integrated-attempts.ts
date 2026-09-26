import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db, churchesTable, integratedAttemptsTable } from "@workspace/db";
import { assessmentConfiguration } from "../lib/assessment-configuration";
import { ministryCustomization } from "../lib/ministry-customization";
import { activeSpiritualGifts } from "../lib/spiritual-gifts";
import { answersError, createIntegratedSnapshot, type IntegratedSnapshot } from "../lib/integrated-assessment";
import { assertAttemptAvailable, attemptPredicate, formStateError, hashToken, IntegratedAttemptError, loadIntegratedAttempt, publicAttempt } from "../lib/integrated-attempts";

const router: IRouter = Router();
const paramsSchema = z.object({ churchId: z.coerce.number().int().positive(), attemptId: z.string().uuid().optional() });
const startSchema = z.object({ adultConfirmed: z.literal(true), celibacyEligible: z.boolean(), optionalExperienceOptIn: z.boolean() }).strict();
const saveSchema = z.object({ revision: z.number().int().min(0).max(2147483646), answers: z.record(z.string(), z.unknown()), formState: z.record(z.string(), z.unknown()) }).strict();
const buckets = new Map<string, { count: number; expires: number }>();
router.use("/churches/:churchId/integrated-attempts", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.expires <= now) buckets.delete(key);
  const key = hashToken(req.ip ?? req.socket.remoteAddress ?? "unknown");
  const bucket = buckets.get(key) ?? { count: 0, expires: now + 60_000 };
  if (bucket.count >= 120 || (!buckets.has(key) && buckets.size >= 10_000)) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Too many assessment requests. Please wait a minute." });
    return;
  }
  bucket.count++;
  buckets.set(key, bucket);
  next();
});

router.post("/churches/:churchId/integrated-attempts", async (req, res) => {
  const params = paramsSchema.safeParse(req.params);
  const body = startSchema.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Confirm adult eligibility and choose the optional assessment settings." }); return; }
  const churchId = params.data.churchId;
  // Hash only; never persist an address or the high-entropy bearer credential.
  const sourceHash = hashToken(`integrated-start:${churchId}:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`);
  const token = randomBytes(32).toString("base64url");
  try {
    const attempt = await db.transaction(async tx => {
      // Serialize starts for a source and church, including across API processes.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${sourceHash}))`);
      const [church] = await tx.select().from(churchesTable).where(eq(churchesTable.id, churchId)).for("update").limit(1);
      if (!church || church.integratedAssessmentPilotEnabled === false) throw new IntegratedAttemptError(404, "The integrated adult assessment is not available for new assessments at this church.");
      const [sourceUsage] = await tx.select({ total: count() }).from(integratedAttemptsTable).where(and(eq(integratedAttemptsTable.sourceHash, sourceHash), gt(integratedAttemptsTable.createdAt, new Date(Date.now() - 3600_000))));
      const [churchUsage] = await tx.select({ total: count() }).from(integratedAttemptsTable).where(and(eq(integratedAttemptsTable.churchId, churchId), eq(integratedAttemptsTable.status, "draft"), gt(integratedAttemptsTable.expiresAt, new Date())));
      // Church participants often share a public network (or a deployment proxy).
      // Permit realistic group starts while bounding persistent draft creation.
      if (sourceUsage.total >= 100 || churchUsage.total >= 1000) throw new IntegratedAttemptError(429, "Too many assessment drafts. Please try again later or contact your church.");
      const configuration = assessmentConfiguration(church.assessmentConfiguration);
      const customization = ministryCustomization(church.ministryCustomization);
      const enabledGifts = activeSpiritualGifts(church.enabledSpiritualGifts);
      if (!configuration || !customization || !enabledGifts) throw new IntegratedAttemptError(400, "This church's assessment settings are invalid. Contact the church administrator.");
      const snapshot = createIntegratedSnapshot({ configuration, customization, enabledGifts, ...body.data });
      const [created] = await tx.insert(integratedAttemptsTable).values({
        churchId, tokenHash: hashToken(token), sourceHash, snapshot,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600_000),
      }).returning();
      return created;
    });
    res.status(201).json({ ...publicAttempt(attempt), token });
  } catch (error) {
    if (error instanceof IntegratedAttemptError) { res.status(error.status).json({ error: error.message }); return; }
    req.log.error({ churchId }, "Unable to start integrated assessment");
    res.status(503).json({ error: "Unable to start your assessment right now. Please try again." });
  }
});

router.get("/churches/:churchId/integrated-attempts/:attemptId", async (req, res) => {
  const params = paramsSchema.safeParse(req.params);
  const token = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization ?? "")?.[1];
  if (!params.success || !params.data.attemptId || !token) { res.status(404).json({ error: "Assessment draft not found." }); return; }
  try {
    res.json(publicAttempt(await loadIntegratedAttempt(params.data.churchId, params.data.attemptId, token)));
  } catch (error) {
    if (error instanceof IntegratedAttemptError) { res.status(error.status).json({ error: error.message }); return; }
    req.log.error({ churchId: params.data.churchId }, "Unable to load integrated assessment");
    res.status(503).json({ error: "Unable to load your saved assessment right now. Your saved answers have not been changed. Please try again." });
  }
});

router.patch("/churches/:churchId/integrated-attempts/:attemptId", async (req, res) => {
  const params = paramsSchema.safeParse(req.params);
  const token = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization ?? "")?.[1];
  if (!params.success || !params.data.attemptId || !token) { res.status(404).json({ error: "Assessment draft not found." }); return; }
  const body = saveSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Provide a valid draft revision, answers, and form progress." }); return; }
  try {
    const updated = await db.transaction(async tx => {
      const predicate = attemptPredicate(params.data.churchId, params.data.attemptId!, token);
      const [attempt] = await tx.select().from(integratedAttemptsTable).where(predicate).for("update").limit(1);
      assertAttemptAvailable(attempt);
      if (attempt.status !== "draft" || attempt.revision !== body.data.revision) throw new IntegratedAttemptError(409, "This draft changed or was completed elsewhere. Reload it before saving; your unsaved answers have not been overwritten.");
      const error = answersError(body.data.answers, attempt.snapshot as IntegratedSnapshot) ?? formStateError(body.data.formState);
      if (error) throw new IntegratedAttemptError(400, error);
      const [saved] = await tx.update(integratedAttemptsTable).set({
        answers: body.data.answers, formState: body.data.formState, revision: attempt.revision + 1, updatedAt: new Date(),
      }).where(predicate).returning();
      return saved;
    });
    res.json(publicAttempt(updated));
  } catch (error) {
    if (error instanceof IntegratedAttemptError) { res.status(error.status).json({ error: error.message }); return; }
    req.log.error({ churchId: params.data.churchId }, "Unable to save integrated assessment");
    res.status(503).json({ error: "Unable to confirm your save. Keep this page open, reload the saved revision, and retry without discarding local answers." });
  }
});
export default router;