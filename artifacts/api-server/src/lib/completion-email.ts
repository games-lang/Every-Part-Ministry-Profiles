import { Resend, type CreateEmailOptions } from "resend";
import type { Request } from "express";
import type { churchesTable, ministryProfilesTable } from "@workspace/db";
import { churchBranding } from "./churches";
import { logger } from "./logger";

const defaultSender = "Every Part <noreply@everypart.church>";
type EmailLog = {
  info(fields: { profileId?: number }, message: string): void;
  error(fields: { profileId?: number }, message: string): void;
};
type EmailEnvironment = Partial<Pick<NodeJS.ProcessEnv, "RESEND_API_KEY" | "COMPLETION_EMAIL_FROM" | "APP_URL">>;
type Dependencies = {
  env?: EmailEnvironment;
  log?: EmailLog;
  deliver?: (message: CreateEmailOptions) => Promise<{ error?: unknown }>;
};
type CompletionEmail = {
  to: string;
  memberName: string;
  churchName: string;
  journeyUrl: string;
  replyTo?: string | null;
  profileId?: number;
};

function logSafely(log: EmailLog, level: "info" | "error", profileId: number | undefined, message: string) {
  // Neither provider errors nor message contents may leak private journey links.
  // A logging failure must not affect an already-committed profile either.
  try { log[level]({ profileId }, message); } catch { /* Best-effort side effect. */ }
}

const plainName = (value: string) => value.replace(/\s+/g, " ").trim();
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]!);

export function renderCompletionEmail(input: Pick<CompletionEmail, "memberName" | "churchName" | "journeyUrl">) {
  const memberName = plainName(input.memberName);
  const churchName = plainName(input.churchName);
  const url = new URL(input.journeyUrl);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
      !/^\/journey\/[^/]+$/.test(url.pathname) || url.search || url.hash) {
    throw new Error("A private journey URL is required");
  }
  const thankYou = `Thank you, ${memberName}, for completing your Ministry Profile with ${churchName}.`;
  const next = "Your church leader will follow up.";
  return {
    subject: `Your Ministry Profile is ready — ${churchName}`,
    html: `<!doctype html>
<html lang="en"><body style="margin:0;background:#faf9f6;color:#21333b;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-size:16px;line-height:1.6;">
<p>${escapeHtml(thankYou)}</p>
<p>${next}</p>
<p><a href="${escapeHtml(url.href)}" style="color:#26756f;">Open your private journey</a></p>
</div></body></html>`,
    text: `${thankYou}\n\n${next}\n\nYour private journey:\n${url.href}`,
  };
}

/** Safe to await or queue: neither missing configuration nor delivery failures reject. */
export async function sendCompletionEmail(input: CompletionEmail, dependencies: Dependencies = {}): Promise<void> {
  const env = dependencies.env ?? process.env;
  const log = dependencies.log ?? logger;
  try {
    const key = env.RESEND_API_KEY?.trim();
    if (!key) {
      logSafely(log, "info", input.profileId, "Completion email skipped: RESEND_API_KEY is not configured");
      return;
    }
    const message: CreateEmailOptions = {
      from: env.COMPLETION_EMAIL_FROM?.trim() || defaultSender,
      to: input.to,
      ...renderCompletionEmail(input),
      ...(input.replyTo?.trim() ? { replyTo: input.replyTo.trim() } : {}),
    };
    const result = dependencies.deliver
      ? await dependencies.deliver(message)
      : await new Resend(key).emails.send(message, { signal: AbortSignal.timeout(5_000) });
    if (result.error) {
      logSafely(log, "error", input.profileId, "Unable to send completion email");
    }
  } catch {
    logSafely(log, "error", input.profileId, "Unable to send completion email");
  }
}

export function completionJourneyUrl(request: Pick<Request, "protocol" | "get">, accessToken: string, appUrl?: string) {
  if (!accessToken) throw new Error("A journey token is required");
  // Prefer a configured canonical origin. Do not trust a caller-supplied Origin
  // header to decide where an email's private link should send the recipient.
  const host = request.get("host");
  const origin = new URL(appUrl?.trim() || `${request.protocol}://${host ?? ""}`);
  if (!["https:", "http:"].includes(origin.protocol) || origin.username || origin.password) {
    throw new Error("A valid application origin is required");
  }
  return new URL(`/journey/${encodeURIComponent(accessToken)}`, origin.origin).href;
}

type CompletionNotification = {
  request: Request;
  profile: Pick<typeof ministryProfilesTable.$inferSelect, "id" | "email" | "firstName">;
  church: typeof churchesTable.$inferSelect;
  journeyAccessToken: string;
};

/** Run only after saving. All configuration/rendering/delivery work stays inside the caught task. */
export function queueProfileCompletionEmail(input: CompletionNotification, dependencies: Dependencies = {}): void {
  const log = dependencies.log ?? input.request.log ?? logger;
  const env = dependencies.env ?? process.env;
  void (async () => {
    if (!env.RESEND_API_KEY?.trim()) {
      logSafely(log, "info", input.profile.id, "Completion email skipped: RESEND_API_KEY is not configured");
      return;
    }
    await sendCompletionEmail({
      to: input.profile.email,
      memberName: input.profile.firstName,
      churchName: churchBranding(input.church).name,
      journeyUrl: completionJourneyUrl(input.request, input.journeyAccessToken, env.APP_URL),
      replyTo: input.church.adminEmail,
      profileId: input.profile.id,
    }, { ...dependencies, env, log });
  })().catch(() => {
    logSafely(log, "error", input.profile.id, "Unable to prepare completion email");
  });
}
