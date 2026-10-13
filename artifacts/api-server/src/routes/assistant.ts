import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { pool } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { readAssistantConfig } from "../lib/assistant-config.ts";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const AssistantChatBody = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(1000),
  })).min(1).transform((messages) => messages.slice(-6)),
});

const FAQ_FALLBACK = "You can find answers about Every Part in the Help Center at /help, including Ministry Profiles, church setup, invitations, teams, and privacy. Participants can complete a Ministry Profile without creating an account. Church leaders sign in to use their private dashboard. The AI guide is currently unavailable, but these help articles are available.";

type DailyReservation = { utcDate: string; countToday: number };

export async function reserveAssistantCall(
  cap: number,
  executor: Pick<typeof pool, "query"> = pool,
): Promise<DailyReservation | null> {
  if (cap <= 0) return null;
  // PostgreSQL supplies the UTC date and atomically reserves a call across
  // workers/restarts. Failed or interrupted calls are conservatively counted.
  const result = await executor.query<DailyReservation>(`
    INSERT INTO assistant_daily_usage (utc_day, call_count)
    VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date, 1)
    ON CONFLICT (utc_day) DO UPDATE
      SET call_count = assistant_daily_usage.call_count + 1
      WHERE assistant_daily_usage.call_count < $1
    RETURNING utc_day::text AS "utcDate", call_count AS "countToday"
  `, [cap]);
  return result.rows[0] ?? null;
}

type CompletionRequest = {
  model: string;
  max_completion_tokens: number;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  stream: true;
  stream_options: { include_usage: true };
};
type CompletionChunk = {
  choices: { delta: { content?: string | null } }[];
  usage?: { total_tokens: number } | null;
};
type AssistantDependencies = {
  isEnabled: () => boolean;
  dailyCap: () => number;
  reserveCall: (cap: number) => Promise<DailyReservation | null>;
  createCompletion: (request: CompletionRequest, options: { signal: AbortSignal }) => Promise<AsyncIterable<CompletionChunk>>;
};

const SYSTEM_PROMPT = `You are the Every Part Guide, a warm and practical assistant on the public Every Part website.

Every Part helps churches prayerfully discover how God has shaped their people and connect them with meaningful places to serve and grow. Ministry Profiles reflect on spiritual gifts, how a person ministers, how they tend to operate, passions, skills and experience, spiritual health, availability and current season, and ministry interests.

Your job:
- Answer questions about Every Part, Ministry Profiles, church setup, invitations, profiles, teams, pricing previews, youth pathways, privacy, and how the product works.
- Help visitors decide their next step: explore the website, try Every Part, sign in as a leader, or contact the Every Part team through the feedback form.
- Be concise, welcoming, plainspoken, and church-friendly.
- Treat assessment results and matching as conversation starters, never declarations of calling, spiritual authority, pastoral eligibility, or guaranteed placement.
- Do not claim to access church records, member profiles, accounts, private feedback, or live pricing/billing details.
- Never request passwords, API keys, payment details, sensitive health information, or confidential church/member data.
- Do not provide crisis counseling, legal, medical, or financial advice. Encourage appropriate local pastoral or professional support when needed.
- If asked about unrelated topics, briefly explain that you are here to help with Every Part and church ministry-profile questions.
- If you are uncertain, say so rather than inventing product features.

Relevant product facts:
- Members can complete a Ministry Profile without creating an account.
- Church leaders use a private dashboard to review completed profiles, search, discuss, manage teams, and schedule separately from matching.
- Adult team assignments are pastor-managed and are never made automatically by AI.
- Youth pathways are Discover (ages 6–8), Explore (9–12), Develop (13–17), and the adult Ministry Profile (18+), with guardian consent and private leader access for minors.
- Each church can customize branding, assessment sections, spiritual gifts, teams, and tradition-informed wording.
- Current public pricing is a preview, not active billing.

Use short paragraphs and bullets when helpful.`;

function isRateLimited(requestWindows: Map<string, number[]>, ip: string, now = Date.now()): boolean {
  const recent = (requestWindows.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestWindows.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestWindows.set(ip, recent);
  return false;
}

export function createAssistantRouter(overrides: Partial<AssistantDependencies> = {}): IRouter {
  const router: IRouter = Router();
  const requestWindows = new Map<string, number[]>();
  const dependencies: AssistantDependencies = {
    isEnabled: () => readAssistantConfig().enabled,
    dailyCap: () => readAssistantConfig().dailyCap,
    reserveCall: reserveAssistantCall,
    createCompletion: (request, options) => openai.chat.completions.create(request, options),
    ...overrides,
  };
  router.post("/assistant/chat", async (req, res): Promise<void> => {
  const parsed = AssistantChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please send a valid message." });
    return;
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (isRateLimited(requestWindows, ip)) {
    res.status(429).json({ error: "Please wait a few minutes before sending another message." });
    return;
  }

  const abortController = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abortController.abort();
  });

  const startStream = () => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
  };
  const fallback = () => {
    if (abortController.signal.aborted) return;
    startStream();
    res.write(`data: ${JSON.stringify({ content: FAQ_FALLBACK })}\n\n`);
    res.end(`data: ${JSON.stringify({ done: true })}\n\n`);
  };
  if (!dependencies.isEnabled()) {
    fallback();
    return;
  }

  let reservation: DailyReservation | null;
  try {
    reservation = await dependencies.reserveCall(dependencies.dailyCap());
  } catch {
    // Never make an unmetered call if database accounting is unavailable.
    fallback();
    return;
  }
  if (!reservation || abortController.signal.aborted) {
    fallback();
    return;
  }

  startStream();
  let tokensUsed: number | null = null;
  let outcome = "failed";
  try {
    const stream = await dependencies.createCompletion(
      {
        model: "gpt-5.6-luna",
        max_completion_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...parsed.data.messages.map((message) => ({
            role: message.role,
            content: message.content.trim(),
          })),
        ],
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal: abortController.signal },
    );

    for await (const chunk of stream) {
      if (chunk.usage) tokensUsed = chunk.usage.total_tokens;
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    outcome = "completed";
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch {
    if (abortController.signal.aborted) return;
    res.write(`data: ${JSON.stringify({ content: FAQ_FALLBACK })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } finally {
    req.log.info(`Every Part assistant AI call date=${reservation.utcDate} countToday=${reservation.countToday} tokensUsed=${tokensUsed ?? "unknown"} outcome=${abortController.signal.aborted ? "aborted" : outcome}`);
  }
  });
  return router;
}

export default createAssistantRouter();