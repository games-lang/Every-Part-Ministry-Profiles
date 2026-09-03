import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  CreateAppFeedbackBody,
  CreateAppFeedbackResponse,
  GetAppAdminAccessResponse,
  GetAppFeedbackResponse,
  UpdateAppFeedbackBody,
  UpdateAppFeedbackResponse,
} from "@workspace/api-zod";
import { appFeedbackTable, db } from "@workspace/db";
import { isAppAdminUser, requireAppAdmin, requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";

const router: IRouter = Router();

function feedbackResponse(feedback: typeof appFeedbackTable.$inferSelect) {
  return {
    id: feedback.id,
    churchId: feedback.churchId,
    type: feedback.type,
    category: feedback.category,
    priority: feedback.priority,
    message: feedback.message,
    contactEmail: feedback.contactEmail,
    sourcePage: feedback.sourcePage,
    status: feedback.status,
    adminResponse: feedback.adminResponse,
    respondedAt: feedback.respondedAt,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
  };
}

router.post("/feedback", async (req, res): Promise<void> => {
  const parsed = CreateAppFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = getAuth(req).userId;
  const church = userId ? await getOrCreateChurch(userId) : null;
  const [created] = await db
    .insert(appFeedbackTable)
    .values({
      churchId: church?.id ?? null,
      type: parsed.data.type,
      category: parsed.data.category ?? "other",
      message: parsed.data.message.trim(),
      contactEmail: parsed.data.contactEmail?.trim().toLowerCase() || null,
      sourcePage: parsed.data.sourcePage?.trim() || "sign-in",
    })
    .returning();

  if (!created) throw new Error("Unable to save feedback");

  res.status(201).json(
    CreateAppFeedbackResponse.parse({
      id: created.id,
      status: created.status,
      createdAt: created.createdAt,
    }),
  );
});

router.get("/admin/access", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  res.set("Cache-Control", "no-store");
  res.json(GetAppAdminAccessResponse.parse({ isAdmin: isAppAdminUser(userId) }));
});

router.get("/admin/feedback", async (req, res): Promise<void> => {
  if (!requireAppAdmin(req, res)) return;

  res.set("Cache-Control", "no-store");
  const feedback = await db
    .select()
    .from(appFeedbackTable)
    .orderBy(desc(appFeedbackTable.createdAt));

  res.json(
    GetAppFeedbackResponse.parse({
      items: feedback.map(feedbackResponse),
    }),
  );
});

router.patch("/admin/feedback/:id", async (req, res): Promise<void> => {
  if (!requireAppAdmin(req, res)) return;

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Feedback id must be a positive integer." });
    return;
  }

  const parsed = UpdateAppFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(appFeedbackTable)
    .set({
      status: parsed.data.status,
      category: parsed.data.category ?? "other",
      priority: parsed.data.priority ?? "medium",
      adminResponse: parsed.data.adminResponse?.trim() || null,
      respondedAt:
        parsed.data.adminResponse?.trim() ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(appFeedbackTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Feedback item not found." });
    return;
  }

  res.set("Cache-Control", "no-store");
  res.json(UpdateAppFeedbackResponse.parse(feedbackResponse(updated)));
});

export default router;