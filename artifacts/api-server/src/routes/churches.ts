import { Router, type IRouter } from "express";
import { Readable } from "stream";
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
import {
  activeSpiritualGifts,
  churchResponse,
  getOrCreateChurch,
  validateEnabledSpiritualGifts,
} from "../lib/churches";
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

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
  // OpenAPI's uniqueItems is documented and generated, but the generated Zod
  // validator does not enforce it, so protect the persistence boundary here.
  if (parsed.data.enabledSpiritualGifts) {
    const error = validateEnabledSpiritualGifts(parsed.data.enabledSpiritualGifts);
    if (error) {
      res.status(400).json({ error });
      return;
    }
  }

  const church = await getOrCreateChurch(userId);
  if (parsed.data.logoUrl) {
    try {
      await objectStorage.validateChurchLogo(parsed.data.logoUrl, church.id);
    } catch {
      res.status(400).json({ error: "Choose a valid PNG, JPG, or WebP logo under 5 MB." });
      return;
    }
  }
  const [updated] = await db
    .update(churchesTable)
    .set(parsed.data)
    .where(eq(churchesTable.id, church.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Church not found" });
    return;
  }

  if (
    parsed.data.logoUrl !== undefined &&
    church.logoUrl &&
    church.logoUrl !== parsed.data.logoUrl
  ) {
    try {
      await objectStorage.deleteObject(church.logoUrl);
    } catch (error) {
      req.log.warn(
        { err: error, churchId: church.id },
        "Unable to delete replaced church logo",
      );
    }
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

router.get("/churches/:slug/logo", async (req, res): Promise<void> => {
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
  if (!church?.logoUrl) {
    res.status(404).json({ error: "Logo not found" });
    return;
  }
  try {
    const { file, contentType } = await objectStorage.validateChurchLogo(
      church.logoUrl,
      church.id,
    );
    const response = await objectStorage.downloadObject(file, contentType);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (!response.body) {
      res.end();
      return;
    }
    Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
  } catch (error) {
    if (!(error instanceof ObjectNotFoundError)) {
      req.log.warn({ err: error, churchId: church.id }, "Stored church logo is invalid");
    }
    res.status(404).json({ error: "Logo not found" });
  }
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

  const enabledSpiritualGifts = activeSpiritualGifts(church.enabledSpiritualGifts);
  if (!enabledSpiritualGifts) {
    res.status(422).json({ error: "This church's spiritual gifts configuration is invalid. Please contact the church administrator." });
    return;
  }

  res.json(
    GetPublicChurchResponse.parse({
      name: church.name,
      slug: church.slug,
      logoUrl: church.logoUrl
        ? `/api/churches/${church.slug}/logo?v=${encodeURIComponent(church.logoUrl.split("/").at(-1) || "")}`
        : null,
      primaryColor: church.primaryColor,
      accentColor: church.accentColor,
      profileUrl: `/profile/${church.slug}`,
      enabledSpiritualGifts,
    }),
  );
});

export default router;
