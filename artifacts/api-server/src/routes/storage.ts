import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

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

export default router;