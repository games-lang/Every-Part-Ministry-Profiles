import { Router, type IRouter } from "express";
import { ChatWithAssistantBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestWindows = new Map<string, number[]>();

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

function isRateLimited(ip: string, now = Date.now()): boolean {
  const recent = (requestWindows.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestWindows.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestWindows.set(ip, recent);
  return false;
}

router.post("/assistant/chat", async (req, res): Promise<void> => {
  const parsed = ChatWithAssistantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please send a valid message." });
    return;
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Please wait a few minutes before sending another message." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const abortController = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abortController.abort();
  });

  try {
    const stream = await openai.chat.completions.create(
      {
        model: "gpt-5.6-luna",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...parsed.data.messages.map((message) => ({
            role: message.role,
            content: message.content.trim(),
          })),
        ],
        stream: true,
      },
      { signal: abortController.signal },
    );

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    if (abortController.signal.aborted) return;
    req.log.error({ err: error }, "Every Part assistant request failed");
    res.write(`data: ${JSON.stringify({ error: "The assistant is unavailable right now. Please try again." })}\n\n`);
    res.end();
  }
});

export default router;