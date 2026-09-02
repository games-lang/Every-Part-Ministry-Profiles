import { getAuth } from "@clerk/express";
import type { Request, Response } from "express";

export function requireUserId(req: Request, res: Response): string | null {
  const auth = getAuth(req);
  const userId =
    (auth.sessionClaims?.userId as string | undefined) ?? auth.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return userId;
}

export function requireAppAdmin(req: Request, res: Response): string | null {
  const userId = requireUserId(req, res);
  if (!userId) return null;

  const configuredAdmins = (process.env.EVERY_PART_APP_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!configuredAdmins.includes(userId)) {
    res.status(403).json({ error: "App administrator access is required." });
    return null;
  }

  return userId;
}

export function isAppAdminUser(userId: string): boolean {
  return (process.env.EVERY_PART_APP_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(userId);
}
