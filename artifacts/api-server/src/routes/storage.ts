import {
  RequestProfilePhotoUploadUrlBody,
  RequestProfilePhotoUploadUrlResponse,
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { churchesTable, db } from "@workspace/db";
import { requireChurchLeader, requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();
const profilePhotoUploadWindowMs = 10 * 60 * 1000;
const profilePhotoUploadRequests = new Map<string, number[]>();

// Remove inactive IPs even when no further upload requests arrive.
setInterval(() => {
  const cutoff = Date.now() - profilePhotoUploadWindowMs;
  for (const [ip, timestamps] of profilePhotoUploadRequests) {
    const recent = timestamps.filter((timestamp) => timestamp > cutoff);
    if (recent.length) profilePhotoUploadRequests.set(ip, recent);
    else profilePhotoUploadRequests.delete(ip);
  }
}, 60 * 1000).unref();

router.post("/storage/uploads/request-url", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a PNG, JPG, or WebP image under 5 MB." });
    return;
  }

  try {
    const church = await getOrCreateChurch(userId);
    if (!await requireChurchLeader(userId, church.id, res)) return;
    const uploadURL = await storage.getChurchLogoUploadURL(church.id);
    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath: storage.normalizeObjectEntityPath(uploadURL),
        metadata: parsed.data,
      }),
    );
  } catch (error) {
    req.log.error({ err: error, userId }, "Unable to create logo upload URL");
    res.status(500).json({ error: "Unable to prepare the logo upload." });
  }
});

router.post("/storage/profile-photos/request-url", async (req, res): Promise<void> => {
  const now = Date.now();
  const ip = req.ip || "unknown";
  const recent = (profilePhotoUploadRequests.get(ip) ?? [])
    .filter((timestamp) => timestamp > now - profilePhotoUploadWindowMs);
  if (recent.length >= 10) {
    res.status(429).json({
      error: "Too many photo uploads. Please wait a few minutes and try again.",
    });
    return;
  }
  recent.push(now);
  profilePhotoUploadRequests.set(ip, recent);

  const parsed = RequestProfilePhotoUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a PNG, JPG, or WebP image under 5 MB." });
    return;
  }
  try {
    const [targetChurch] = await db.select().from(churchesTable)
      .where(eq(churchesTable.slug, parsed.data.churchSlug)).limit(1);
    if (!targetChurch) {
      res.status(404).json({ error: "Church not found" });
      return;
    }
    const uploadURL = await storage.getProfilePhotoUploadURL(targetChurch.id);
    res.json(RequestProfilePhotoUploadUrlResponse.parse({
      uploadURL,
      objectPath: storage.normalizeObjectEntityPath(uploadURL),
      metadata: {
        name: parsed.data.name,
        size: parsed.data.size,
        contentType: parsed.data.contentType,
      },
    }));
  } catch (error) {
    req.log.error({ err: error }, "Unable to create profile photo upload URL");
    res.status(500).json({ error: "Unable to prepare the profile photo upload." });
  }
});

export default router;