import { clerkClient } from "@clerk/express";
import { Router, type IRouter } from "express";
import { Readable } from "stream";
import { and, asc, count, eq } from "drizzle-orm";
import {
  AddChurchAdminBody,
  AddChurchAdminResponse,
  ListChurchAdminsResponse,
  GetMyChurchResponse,
  GetChurchAdminAccessParams,
  GetChurchAdminAccessResponse,
  GetPublicChurchParams,
  GetPublicChurchResponse,
  RemoveChurchAdminParams,
  UpdateMyChurchBody,
  UpdateMyChurchResponse,
} from "@workspace/api-zod";
import {
  churchAdminsTable,
  churchesTable,
  db,
  ministryProfilesTable,
} from "@workspace/db";
import { requireUserId } from "../lib/auth";
import {
  activeSpiritualGifts,
  churchResponse,
  getOrCreateChurch,
  validateEnabledSpiritualGifts,
} from "../lib/churches";
import { assessmentConfiguration } from "../lib/assessment-configuration";
import { ministryCustomization } from "../lib/ministry-customization";
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

function adminResponse(admin: typeof churchAdminsTable.$inferSelect) {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    createdAt: admin.createdAt,
  };
}

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
  if (
    parsed.data.assessmentConfiguration !== undefined &&
    !assessmentConfiguration(parsed.data.assessmentConfiguration)
  ) {
    res.status(400).json({
      error: "Assessment configuration contains unsupported keys or enables a subsection whose section is disabled.",
    });
    return;
  }
  const customization =
    parsed.data.ministryCustomization === undefined
      ? undefined
      : ministryCustomization(parsed.data.ministryCustomization);
  if (
    parsed.data.ministryCustomization !== undefined &&
    !customization
  ) {
    res.status(400).json({
      error:
        "Ministry customization contains unsupported values or an incomplete custom tradition.",
    });
    return;
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
  const { onboardingCompleted, ...churchUpdate } = parsed.data;
  const [updated] = await db
    .update(churchesTable)
    .set({
      ...churchUpdate,
      ...(customization ? { ministryCustomization: customization } : {}),
      ...(onboardingCompleted ? { onboardingCompletedAt: new Date() } : {}),
    })
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

router.get("/church/admins", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const church = await getOrCreateChurch(userId);
  const admins = await db
    .select()
    .from(churchAdminsTable)
    .where(eq(churchAdminsTable.churchId, church.id))
    .orderBy(
      asc(churchAdminsTable.role),
      asc(churchAdminsTable.name),
      asc(churchAdminsTable.email),
    );

  res.json(ListChurchAdminsResponse.parse(admins.map(adminResponse)));
});

router.post("/church/admins", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = AddChurchAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const email = parsed.data.email.trim().toLowerCase();
  let clerkUser;
  try {
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    clerkUser = users.data[0];
  } catch (error) {
    req.log.error({ err: error }, "Unable to look up church administrator");
    res.status(503).json({ error: "Unable to verify that pastor's account right now." });
    return;
  }

  if (!clerkUser) {
    res.status(404).json({
      error: "No Every Part account was found for that email. Ask the pastor to create an account first.",
    });
    return;
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    email;
  const [existing] = await db
    .select()
    .from(churchAdminsTable)
    .where(
      and(
        eq(churchAdminsTable.churchId, church.id),
        eq(churchAdminsTable.clerkUserId, clerkUser.id),
      ),
    )
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "That pastor is already an administrator." });
    return;
  }

  const [created] = await db
    .insert(churchAdminsTable)
    .values({
      churchId: church.id,
      clerkUserId: clerkUser.id,
      email,
      name,
      role: "admin",
    })
    .returning();
  if (!created) throw new Error("Unable to add church administrator");

  res.status(201).json(AddChurchAdminResponse.parse(adminResponse(created)));
});

router.delete("/church/admins/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const params = RemoveChurchAdminParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const church = await getOrCreateChurch(userId);
  const [admin] = await db
    .select()
    .from(churchAdminsTable)
    .where(
      and(
        eq(churchAdminsTable.id, params.data.id),
        eq(churchAdminsTable.churchId, church.id),
      ),
    )
    .limit(1);
  if (!admin) {
    res.status(404).json({ error: "Administrator not found." });
    return;
  }
  if (admin.role === "owner") {
    res.status(400).json({ error: "The church owner cannot be removed." });
    return;
  }

  await db
    .delete(churchAdminsTable)
    .where(
      and(
        eq(churchAdminsTable.id, admin.id),
        eq(churchAdminsTable.churchId, church.id),
      ),
    );
  res.status(204).end();
});

router.get("/churches/:slug/admin-access", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const params = GetChurchAdminAccessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  // This check intentionally uses the requested public church directly. Do
  // not use getOrCreateChurch here: it could create an unrelated church for a
  // signed-in user who is not an administrator of this slug.
  const [church] = await db
    .select({ id: churchesTable.id })
    .from(churchesTable)
    .where(eq(churchesTable.slug, params.data.slug))
    .limit(1);
  if (!church) {
    res.status(404).json({ error: "Church not found" });
    return;
  }
  const [membership] = await db
    .select({ id: churchAdminsTable.id })
    .from(churchAdminsTable)
    .where(
      and(
        eq(churchAdminsTable.churchId, church.id),
        eq(churchAdminsTable.clerkUserId, userId),
      ),
    )
    .limit(1);

  res.json(
    GetChurchAdminAccessResponse.parse({
      canOverrideYouthPathway: Boolean(membership),
    }),
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

  const configuration = assessmentConfiguration(church.assessmentConfiguration);
  if (!configuration) {
    res.status(422).json({ error: "This church's assessment configuration is invalid. Please contact the church administrator." });
    return;
  }
  const enabledSpiritualGifts = activeSpiritualGifts(church.enabledSpiritualGifts);
  if (!enabledSpiritualGifts && configuration.sections.spiritualGifts) {
    res.status(422).json({ error: "This church's spiritual gifts configuration is invalid. Please contact the church administrator." });
    return;
  }
  const customization = ministryCustomization(church.ministryCustomization);
  if (!customization) {
    res.status(422).json({
      error:
        "This church's ministry customization is invalid. Please contact the church administrator.",
    });
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
       enabledSpiritualGifts: enabledSpiritualGifts ?? activeSpiritualGifts(null)!,
       assessmentConfiguration: configuration,
        ministryCustomization: customization,
    }),
  );
});

export default router;
