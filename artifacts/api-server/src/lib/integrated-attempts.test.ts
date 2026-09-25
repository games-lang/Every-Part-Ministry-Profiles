import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes, randomUUID } from "node:crypto";

// Explicit opt-in: this integration test creates and removes its own isolated
// development tenant, never uses real participant/church records or starts HTTP.
test("adult pilot draft and final-submit contract, tenant isolation, atomicity and retries", {
  skip: process.env.RUN_INTEGRATED_DB_TESTS !== "1",
}, async () => {
  const { db, pool, churchesTable, integratedAttemptsTable, ministryProfilesTable, ministryJourneysTable } = await import("@workspace/db");
  const { eq, and, count } = await import("drizzle-orm");
  const { defaultAssessmentConfiguration } = await import("./assessment-configuration.ts");
  const { defaultMinistryCustomization } = await import("./ministry-customization.ts");
  const { hashToken, formStateError, publicAttempt } = await import("./integrated-attempts");
  const { default: attemptRouter } = await import("../routes/integrated-attempts");
  const { default: profilesRouter } = await import("../routes/profiles");
  const { default: journeysRouter } = await import("../routes/journeys");
  const suffix = randomUUID();
  const slug = `integrated-contract-${suffix}`;
  const now = Date.now();
  const configuration = defaultAssessmentConfiguration();
  // Real nonassessment data is deliberately omitted from this synthetic fixture.
  for (const section of ["aboutYou", "passionsInterests", "connectionAvailability", "spiritualHealth"] as const) {
    configuration.sections[section] = false;
    for (const key of Object.keys(configuration.subsections) as (keyof typeof configuration.subsections)[]) {
      if (key.startsWith(`${section}.`)) configuration.subsections[key] = false;
    }
  }
  const [church] = await db.insert(churchesTable).values({
    name: "Isolated integrated contract test", slug, adminName: "Test", adminEmail: "test@example.invalid",
    assessmentConfiguration: configuration, ministryCustomization: defaultMinistryCustomization(),
    integratedAssessmentPilotEnabled: true, billingPlan: "starter",
  }).returning();

  async function call(router: unknown, method: string, path: string, input: {
    params?: Record<string, string>; body?: unknown; token?: string;
  } = {}) {
    const layer = (router as { stack: any[] }).stack.find(entry => entry.route?.path === path && entry.route.methods[method]);
    assert.ok(layer, `${method} ${path} exists`);
    const response = {
      statusCode: 200, body: null as any,
      setHeader() { return this; },
      status(code: number) { this.statusCode = code; return this; },
      json(body: unknown) { this.body = body; return this; },
    };
    await layer.route.stack[0].handle({
      params: { churchId: String(church.id), ...input.params },
      body: input.body ?? {}, headers: input.token ? { authorization: `Bearer ${input.token}` } : {},
      ip: suffix, socket: {}, log: { warn() {}, error() {} },
    }, response, (error: unknown) => { if (error) throw error; });
    return response;
  }
  const startPath = "/churches/:churchId/integrated-attempts";
  const draftPath = `${startPath}/:attemptId`;
  const startBody = { adultConfirmed: true, celibacyEligible: false, optionalExperienceOptIn: true };
  const profileBody = {
    churchSlug: slug, profileType: "adult", age: 30,
    basicInformation: { firstName: "Contract", lastName: "Fixture", email: "fixture@example.invalid" },
  };
  let createdProfileId: number | undefined;
  try {
    assert.equal((await call(attemptRouter, "post", startPath, { body: { ...startBody, adultConfirmed: false } })).statusCode, 400);
    const start = await call(attemptRouter, "post", startPath, { body: startBody });
    assert.equal(start.statusCode, 201, JSON.stringify(start.body));
    const { attemptId, token } = start.body;
    assert.equal(token.length, 43);
    assert.equal(start.body.questions.length, 95);
    assert.equal(start.body.questions.some((q: any) => q.maps || q.construct || q.kind), false);
    assert.equal(start.body.snapshot.questions, undefined);
    assert.equal(start.body.snapshot.adultConfirmed, true);
    assert.equal(new Date(start.body.expiresAt).getTime() > now + 29 * 86400_000, true);
    const [stored] = await db.select().from(integratedAttemptsTable).where(eq(integratedAttemptsTable.id, attemptId));
    assert.equal(stored.tokenHash, hashToken(token));
    assert.equal(JSON.stringify(stored).includes(token), false);
    assert.equal(publicAttempt(stored).snapshot.questionIds.length, 95);
    assert.ok(formStateError({ token }));
    assert.ok(formStateError({ basicInformation: { firstName: "a".repeat(49_000) } }));
    assert.ok(formStateError({ scores: { invented: 5 } }));

    assert.equal((await call(attemptRouter, "get", draftPath, { params: { attemptId } })).statusCode, 404);
    assert.equal((await call(attemptRouter, "get", draftPath, { params: { attemptId }, token: randomBytes(32).toString("base64url") })).statusCode, 404);
    assert.equal((await call(attemptRouter, "get", draftPath, { params: { attemptId, churchId: String(church.id + 1) }, token })).statusCode, 404);
    const forged = await call(attemptRouter, "patch", draftPath, {
      params: { attemptId }, token, body: { revision: 0, answers: { madeUp: 5 }, formState: {} },
    });
    assert.equal(forged.statusCode, 400);
    assert.equal((await call(attemptRouter, "patch", draftPath, {
      params: { attemptId }, token, body: { revision: 0, answers: {}, formState: {}, snapshot: { questions: [] } },
    })).statusCode, 400);
    const answers = Object.fromEntries(start.body.questions.map((q: any) => [q.id, 5]));
    const progress = { basicInformation: profileBody.basicInformation, _stepIndex: 2, strengthNotes: "bounded local progress" };
    const races = await Promise.all([1, 2].map(() => call(attemptRouter, "patch", draftPath, {
      params: { attemptId }, token, body: { revision: 0, answers, formState: progress },
    })));
    assert.deepEqual(races.map(r => r.statusCode).sort(), [200, 409]);
    // Later church changes cannot alter this journey's prompts, wording or enabled sections.
    await db.update(churchesTable).set({
      integratedAssessmentPilotEnabled: false, assessmentConfiguration: defaultAssessmentConfiguration(),
      ministryCustomization: { ...defaultMinistryCustomization(), spiritualGiftsLabel: "New future wording" },
    }).where(eq(churchesTable.id, church.id));
    assert.equal((await call(attemptRouter, "post", startPath, { body: startBody })).statusCode, 404);
    const resumed = await call(attemptRouter, "get", draftPath, { params: { attemptId }, token });
    assert.equal(resumed.statusCode, 200);
    assert.equal(resumed.body.token, undefined);
    assert.equal(resumed.body.revision, 1);
    assert.deepEqual(resumed.body.questions, start.body.questions);
    assert.deepEqual(resumed.body.formState, progress);
    const credentials = { attemptId, token, revision: 1 };
    assert.equal((await call(profilesRouter, "post", "/profiles", { body: { ...profileBody, age: 17, integratedAttempt: credentials } })).statusCode, 400);
    assert.equal((await call(profilesRouter, "post", "/profiles", { body: { ...profileBody, birthdate: "2015-01-01", integratedAttempt: credentials } })).statusCode, 400);
    assert.equal((await call(profilesRouter, "post", "/profiles", { body: { ...profileBody, integratedAttempt: { ...credentials, revision: 0 } } })).statusCode, 409);
    // Exact cap must be checked at completion, not frozen at start.
    await db.insert(ministryProfilesTable).values(Array.from({ length: 5 }, () => ({
      churchId: church.id, firstName: "Cap", lastName: "Fixture", email: "cap@example.invalid",
      passions: [], interests: [], availability: [],
    })));
    const capped = await call(profilesRouter, "post", "/profiles", { body: { ...profileBody, integratedAttempt: credentials } });
    assert.equal(capped.statusCode, 403);
    const [stillDraft] = await db.select().from(integratedAttemptsTable).where(eq(integratedAttemptsTable.id, attemptId));
    assert.equal(stillDraft.status, "draft");
    assert.equal(stillDraft.revision, 1);
    assert.deepEqual(stillDraft.answers, answers);
    await db.update(churchesTable).set({ billingPlan: "unlimited" }).where(eq(churchesTable.id, church.id));
    const completed = await Promise.all([1, 2].map(() => call(profilesRouter, "post", "/profiles", {
      body: {
        ...profileBody, integratedAttempt: credentials,
        integratedAssessment: { constructs: [{ construct: "Forged", mean: 999 }] },
        assessmentConfigurationSnapshot: defaultAssessmentConfiguration(),
      },
    })));
    for (const response of completed) assert.ok([200, 201].includes(response.statusCode), JSON.stringify(response.body));
    assert.equal(completed[0].body.id, completed[1].body.id);
    createdProfileId = completed[0].body.id;
    const reviewPath = "/journeys/:token/profiles/:profileId/answer-review";
    const review = await call(journeysRouter, "get", reviewPath, {
      params: { token: completed[0].body.journeyToken, profileId: String(createdProfileId) },
    });
    assert.equal(review.statusCode, 200, JSON.stringify(review.body));
    assert.equal(review.body.sections[0].label, "Reflections");
    assert.ok(review.body.patterns.length <= 3);
    assert.equal(JSON.stringify(review.body).includes('"maps"'), false);
    assert.equal((await call(journeysRouter, "get", reviewPath, {
      params: { token: randomUUID(), profileId: String(createdProfileId) },
    })).statusCode, 404);
    assert.equal((await call(journeysRouter, "get", reviewPath, {
      params: { token: completed[0].body.journeyToken, profileId: "0" },
    })).statusCode, 404);
    assert.equal(completed[0].body.assessmentSections.apest, null);
    assert.equal(completed[0].body.integratedAssessment.version, "integrated-assessment-v1");
    assert.equal(completed[0].body.integratedAssessment.constructs.some((c: any) => c.construct === "Forged"), false);
    assert.equal(completed[0].body.assessmentConfiguration.sections.aboutYou, false);
    const [usage] = await db.select({ count: count() }).from(ministryProfilesTable).where(eq(ministryProfilesTable.churchId, church.id));
    assert.equal(usage.count, 6, "concurrent completion consumes exactly one profile slot");
    const retry = await call(profilesRouter, "post", "/profiles", { body: { ...profileBody, integratedAttempt: credentials } });
    assert.equal(retry.statusCode, 200);
    assert.equal(retry.body.id, createdProfileId);
    assert.equal((await call(attemptRouter, "patch", draftPath, { params: { attemptId }, token, body: { revision: 2, answers: {}, formState: {} } })).statusCode, 409);
    await db.update(integratedAttemptsTable).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(integratedAttemptsTable.id, attemptId));
    assert.equal((await call(attemptRouter, "get", draftPath, { params: { attemptId }, token })).statusCode, 410);
    assert.equal((await call(profilesRouter, "post", "/profiles", { body: { ...profileBody, integratedAttempt: credentials } })).statusCode, 410);
    await db.update(churchesTable).set({ integratedAssessmentPilotEnabled: true }).where(eq(churchesTable.id, church.id));
    // Synthetic expired-free records exercise the persisted per-source bound.
    await db.insert(integratedAttemptsTable).values(Array.from({ length: 99 }, () => ({
      churchId: church.id, tokenHash: hashToken(randomBytes(32).toString("base64url")),
      sourceHash: stored.sourceHash, snapshot: stored.snapshot, expiresAt: new Date(Date.now() + 86400_000),
    })));
    assert.equal((await call(attemptRouter, "post", startPath, { body: startBody })).statusCode, 429);
    const limiter = (attemptRouter as unknown as { stack: any[] }).stack[0].handle;
    let limitedStatus = 200;
    let nextCount = 0;
    const limiterResponse = { setHeader() {}, status(code: number) { limitedStatus = code; return this; }, json() {} };
    for (let i = 0; i < 121; i++) limiter({ ip: `limiter-${suffix}`, socket: {} }, limiterResponse, () => { nextCount++; });
    assert.equal(limitedStatus, 429);
    assert.equal(nextCount, 120);
  } finally {
    // Referenced completed attempts must go before test profiles.
    await db.delete(integratedAttemptsTable).where(eq(integratedAttemptsTable.churchId, church.id));
    await db.delete(ministryProfilesTable).where(eq(ministryProfilesTable.churchId, church.id));
    await db.delete(ministryJourneysTable).where(eq(ministryJourneysTable.churchId, church.id));
    await db.delete(churchesTable).where(and(eq(churchesTable.id, church.id), eq(churchesTable.slug, slug)));
    await pool.end();
  }
});