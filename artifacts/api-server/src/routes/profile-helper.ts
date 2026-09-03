import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  ChatWithProfileHelperBody,
  ChatWithProfileHelperParams,
  ChatWithProfileHelperResponse,
} from "@workspace/api-zod";
import { db, ministryProfilesTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import { profileHelperSignals } from "../lib/profile-helper-signals";
import {
  AiCreditsExceededError,
  reserveAiCredits,
} from "../lib/ai-credits";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are the Every Part Profile Helper for authenticated church leaders.

You help a pastor or ministry leader prepare for a warm, thoughtful conversation with one adult who completed a Ministry Profile. You receive only selected structured profile signals. You never receive the person's name, contact information, demographics, private free-text responses, life experiences, spiritual-health answers, or pastoral notes.

Follow these rules:
- Use only the supplied structured signals. Never claim to know information that is not present.
- Treat every signal as a self-reported conversation starter, not a diagnosis, calling, qualification, willingness, certainty, or placement recommendation.
- Do not decide whether the person should serve, lead, teach, work with children, hold pastoral authority, or join a particular team.
- Do not infer spiritual maturity, character, safety, theology, availability beyond what is explicitly supplied, or why a signal is absent.
- Never rank the person against others.
- Suggest open-ended questions, affirmations, and topics the leader can explore with the person.
- Encourage the leader to listen, confirm the person's current season and interest, and follow the church's normal screening and safeguarding processes.
- If asked to make a placement or eligibility decision, explain the boundary and offer conversation questions instead.
- Keep responses concise, warm, practical, and church-friendly. Use short paragraphs or bullets.
- Refer to the profile owner as "this person" or "they"; do not invent a name.

The leader sees a reminder that AI can make mistakes and that all guidance is advisory.`;

router.post("/profiles/:id/helper", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const params = ChatWithProfileHelperParams.safeParse(req.params);
  const body = ChatWithProfileHelperBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Please send a valid profile helper message." });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const [profile] = await db
    .select()
    .from(ministryProfilesTable)
    .where(
      and(
        eq(ministryProfilesTable.id, params.data.id),
        eq(ministryProfilesTable.churchId, church.id),
      ),
    )
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  if (profile.profileType !== "adult") {
    res.status(400).json({
      error: "The profile helper is only available for adult Ministry Profiles.",
    });
    return;
  }

  try {
    await reserveAiCredits(church.id);
  } catch (error) {
    if (error instanceof AiCreditsExceededError) {
      res.status(403).json({ error: error.message });
      return;
    }
    throw error;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 3000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `Safe structured profile signals:\n${JSON.stringify(profileHelperSignals(profile))}`,
        },
        ...body.data.messages.map((message) => ({
          role: message.role,
          content: message.content.trim(),
        })),
      ],
    });
    const answer = completion.choices[0]?.message.content?.trim();
    if (!answer) throw new Error("Profile helper returned an empty response");
    res.json(ChatWithProfileHelperResponse.parse({ answer }));
  } catch (error) {
    req.log.error(
      { err: error, profileId: profile.id, churchId: church.id },
      "Profile helper request failed",
    );
    res.status(502).json({
      error: "The profile helper is unavailable right now. Please try again.",
    });
  }
});

export default router;