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
