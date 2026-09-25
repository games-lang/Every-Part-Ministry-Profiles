import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  GetChurchDeletionAccessResponse,
  ListChurchRemovalAuditResponse,
  RemoveChurchPersonParams,
  RemoveChurchProfileParams,
} from "@workspace/api-zod";
import {
  churchAdminsTable,
  churchRemovalAuditTable,
  db,
} from "@workspace/db";
import { requireUserId } from "../lib/auth";
import {
  canRemoveChurchRecords,
  ProfilePhotoCleanupError,
  removeChurchPerson,
  removeChurchProfile,
} from "../lib/church-removal";
import { getOrCreateChurch } from "../lib/churches";

const router: IRouter = Router();

async function currentMembership(userId: string, churchId: number) {
  const [membership] = await db
    .select()
    .from(churchAdminsTable)
    .where(
      and(
        eq(churchAdminsTable.churchId, churchId),
        eq(churchAdminsTable.clerkUserId, userId),
      ),
    )
    .limit(1);
  return membership;
}

router.get("/church/deletion-access", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const church = await getOrCreateChurch(userId);
  const membership = await currentMembership(userId, church.id);
  res.setHeader("Cache-Control", "no-store");
  res.json(
    GetChurchDeletionAccessResponse.parse({
      canRemove: canRemoveChurchRecords(membership?.role),
      isOwner: membership?.role === "owner",
    }),
  );
});

router.get("/church/removal-audit", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const church = await getOrCreateChurch(userId);
  const membership = await currentMembership(userId, church.id);
  if (membership?.role !== "owner") {
    res.status(403).json({ error: "Church owner access is required." });
    return;
  }
  const audit = await db
    .select({
      id: churchRemovalAuditTable.id,
      subjectName: churchRemovalAuditTable.subjectName,
      actorName: churchRemovalAuditTable.actorName,
      removedAt: churchRemovalAuditTable.removedAt,
      kind: churchRemovalAuditTable.kind,
    })
    .from(churchRemovalAuditTable)
    .where(eq(churchRemovalAuditTable.churchId, church.id))
    .orderBy(desc(churchRemovalAuditTable.removedAt), desc(churchRemovalAuditTable.id));
  res.setHeader("Cache-Control", "no-store");
  res.json(ListChurchRemovalAuditResponse.parse(audit));
});

router.delete("/profiles/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = RemoveChurchProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const membership = await currentMembership(userId, church.id);
  if (!canRemoveChurchRecords(membership?.role)) {
    res.status(403).json({ error: "Church owner, admin, or pastor access is required." });
    return;
  }
  let removed: boolean;
  try {
    removed = await db.transaction((tx) =>
      removeChurchProfile(
        tx,
        church.id,
        params.data.id,
        userId,
        membership.name.trim() || membership.email,
      ),
    );
  } catch (error) {
    if (error instanceof ProfilePhotoCleanupError) {
      req.log.error({ churchId: church.id, profileId: params.data.id }, "Profile photo cleanup failed during permanent removal");
      res.status(503).json({
        error: "The profile photo could not be removed from storage. No database records were removed; retry the deletion.",
      });
      return;
    }
    throw error;
  }
  if (!removed) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.sendStatus(204);
});

router.delete("/people/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const params = RemoveChurchPersonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const church = await getOrCreateChurch(userId);
  const membership = await currentMembership(userId, church.id);
  if (!canRemoveChurchRecords(membership?.role)) {
    res.status(403).json({ error: "Church owner, admin, or pastor access is required." });
    return;
  }
  let removed: boolean;
  try {
    removed = await db.transaction((tx) =>
      removeChurchPerson(
        tx,
        church.id,
        params.data.id,
        userId,
        membership.name.trim() || membership.email,
      ),
    );
  } catch (error) {
    if (error instanceof ProfilePhotoCleanupError) {
      req.log.error({ churchId: church.id, personId: params.data.id }, "Profile photo cleanup failed during permanent removal");
      res.status(503).json({
        error: "The profile photo could not be removed from storage. No database records were removed; retry the deletion.",
      });
      return;
    }
    throw error;
  }
  if (!removed) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;