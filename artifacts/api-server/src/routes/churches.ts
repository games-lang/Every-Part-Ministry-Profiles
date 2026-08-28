import { Router, type IRouter } from "express";
import { count, eq } from "drizzle-orm";
import {
  GetMyChurchResponse,
  GetPublicChurchParams,
  GetPublicChurchResponse,
  UpdateMyChurchBody,
  UpdateMyChurchResponse,
} from "@workspace/api-zod";
import { churchesTable, db, ministryProfilesTable } from "@workspace/db";
import { requireUserId } from "../lib/auth";
import { churchResponse, getOrCreateChurch } from "../lib/churches";

const router: IRouter = Router();

router.get("/church", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const church = await getOrCreateChurch(userId);
  const [result] = await db
    .select({ count: count() })
    .from(ministryProfilesTable)
    .where(eq(ministryProfilesTable.churchId, church.id));

  res.json(GetMyChurchResponse.parse(churchResponse(church, result?.count ?? 0)));
});

router.patch("/church", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = UpdateMyChurchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const [updated] = await db
    .update(churchesTable)
    .set(parsed.data)
    .where(eq(churchesTable.id, church.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Church not found" });
    return;
  }

  const [result] = await db
    .select({ count: count() })
    .from(ministryProfilesTable)
    .where(eq(ministryProfilesTable.churchId, church.id));

  res.json(
    UpdateMyChurchResponse.parse(
      churchResponse(updated, result?.count ?? 0),
    ),
  );
});

router.get("/churches/:slug", async (req, res): Promise<void> => {
  const params = GetPublicChurchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [church] = await db
    .select()
    .from(churchesTable)
    .where(eq(churchesTable.slug, params.data.slug))
    .limit(1);

  if (!church) {
    res.status(404).json({ error: "Church not found" });
    return;
  }

  res.json(
    GetPublicChurchResponse.parse({
      name: church.name,
      slug: church.slug,
      logoUrl: church.logoUrl,
      profileUrl: `/profile/${church.slug}`,
    }),
  );
});

export default router;
