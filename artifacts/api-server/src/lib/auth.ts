import { getAuth } from "@clerk/express";
import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { churchAdminsTable, db } from "@workspace/db";

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

const trustedChurchLeaderRoles = new Set([
  "owner",
  "admin",
  "pastor",
  "ministry_leader",
]);

/** Verifies that a user is a trusted leader in the requested church. */
export async function requireChurchLeader(
  userId: string,
  churchId: number,
  res: Response,
): Promise<typeof churchAdminsTable.$inferSelect | null> {
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
  if (!membership || !trustedChurchLeaderRoles.has(membership.role)) {
    res.status(403).json({ error: "Church leader access is required." });
    return null;
  }
  return membership;
}

export function isTrustedChurchLeaderRole(role: string): boolean {
  return trustedChurchLeaderRoles.has(role);
}
