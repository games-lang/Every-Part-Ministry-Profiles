import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, integratedAttemptsTable, type IntegratedAttempt } from "@workspace/db";
import { z } from "zod";
import type { IntegratedSnapshot } from "./integrated-assessment";

export const attemptCredentials = z.object({
  attemptId: z.string().uuid(),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  revision: z.number().int().min(0).max(2147483646),
}).strict();
export class IntegratedAttemptError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export function attemptPredicate(churchId: number, id: string, token: string) {
  return and(eq(integratedAttemptsTable.churchId, churchId), eq(integratedAttemptsTable.id, id), eq(integratedAttemptsTable.tokenHash, hashToken(token)));
}
export async function loadIntegratedAttempt(churchId: number, id: string, token: string) {
  const [attempt] = await db.select().from(integratedAttemptsTable).where(attemptPredicate(churchId, id, token)).limit(1);
  assertAttemptAvailable(attempt);
  return attempt!;
}
export function assertAttemptAvailable(attempt: IntegratedAttempt | undefined): asserts attempt is IntegratedAttempt {
  if (!attempt) throw new IntegratedAttemptError(404, "Assessment draft not found.");
  if (attempt.expiresAt.getTime() <= Date.now()) throw new IntegratedAttemptError(410, "This assessment draft has expired. Start a new assessment.");
}
export function publicAttempt(attempt: IntegratedAttempt) {
  const { questions, ...snapshot } = attempt.snapshot as IntegratedSnapshot;
  return {
    attemptId: attempt.id, revision: attempt.revision, expiresAt: attempt.expiresAt.toISOString(),
    status: attempt.status, profileId: attempt.profileId, bankVersion: snapshot.bankVersion, scoringVersion: snapshot.scoringVersion,
    snapshot, responseModels: snapshot.responseModels,
    questions: questions.map(({ id, text, responseModel, poles }) => ({ id, text, responseModel, ...(poles ? { poles } : {}) })),
    answers: attempt.answers, formState: attempt.formState,
  };
}

// Explicit non-assessment allowlist prevents drafts becoming an arbitrary data store.
const formKeys = new Set([
  "step", "currentStep", "round", "questionIndex", "profileType", "age", "birthdate",
  "basicInformation", "churchConnection", "skills", "passions", "interests", "availability",
  "servingFrequency", "languages", "churchDetails", "skillsDetails", "lifeExperiences",
  "availabilityDetails", "ministryPreferences", "spiritualHealth", "profilePhotoPath", "journeyToken", "inviteToken",
  "_stepIndex", "languageEntries", "occupation", "lifeSelected", "lifeNotes", "preferences", "strengthNotes",
]);
export function formStateError(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Form progress must be an object.";
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > 48_000) return "Form progress exceeds the 48 KB limit.";
  if (Object.keys(value).some(key => !formKeys.has(key))) return "Form progress contains an unsupported field.";
  function valid(node: unknown, depth = 0): boolean {
    if (depth > 8) return false;
    if (node === null || typeof node === "boolean") return true;
    if (typeof node === "number") return Number.isFinite(node);
    if (typeof node === "string") return node.length <= 10_000;
    if (Array.isArray(node)) return node.length <= 150 && node.every(child => valid(child, depth + 1));
    if (typeof node === "object") return Object.entries(node).length <= 150 && Object.entries(node).every(([key, child]) =>
      key.length <= 100 && !["__proto__", "constructor", "prototype", "integratedAttempt", "token"].includes(key) && valid(child, depth + 1));
    return false;
  }
  return valid(value) ? null : "Form progress has invalid or overly complex data.";
}