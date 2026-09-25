import { count, eq } from "drizzle-orm";
import {
  churchesTable,
  db,
  ministryProfilesTable,
} from "@workspace/db";

export const PROFILE_LIMITS = {
  starter: 5,
  growing: 50,
  complete: 100,
  network: 250,
  unlimited: null,
} as const;

// Planned plan capacities remain visible, but do not restrict early-access churches.
const PROFILE_LIMITS_ACTIVE = false;

export type ProfilePlan = keyof typeof PROFILE_LIMITS;
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class ProfileLimitReachedError extends Error {
  constructor(
    readonly plan: ProfilePlan,
    readonly limit: number,
  ) {
    super(
      `This church has reached its ${planName(plan)} plan limit of ${limit} profiles. A church administrator can upgrade the plan to accept more profiles.`,
    );
    this.name = "ProfileLimitReachedError";
  }
}

function planName(plan: ProfilePlan) {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;
}

export function profileLimitForPlan(plan: string): number | null {
  return plan in PROFILE_LIMITS
    ? PROFILE_LIMITS[plan as ProfilePlan]
    : PROFILE_LIMITS.starter;
}

export async function assertProfileCapacity(
  tx: DbTransaction,
  churchId: number,
) {
  if (!PROFILE_LIMITS_ACTIVE) return;

  const [church] = await tx
    .select({
      billingPlan: churchesTable.billingPlan,
    })
    .from(churchesTable)
    .where(eq(churchesTable.id, churchId))
    .for("update")
    .limit(1);
  if (!church) throw new Error("Church not found");

  const [usage] = await tx
    .select({ profilesUsed: count() })
    .from(ministryProfilesTable)
    .where(eq(ministryProfilesTable.churchId, churchId));
  const plan =
    church.billingPlan in PROFILE_LIMITS
      ? (church.billingPlan as ProfilePlan)
      : "starter";
  const limit = profileLimitForPlan(plan);
  if (limit !== null && (usage?.profilesUsed ?? 0) >= limit) {
    throw new ProfileLimitReachedError(plan, limit);
  }
}

export async function getProfileUsage(churchId: number, plan: string) {
  const [usage] = await db
    .select({ profilesUsed: count() })
    .from(ministryProfilesTable)
    .where(eq(ministryProfilesTable.churchId, churchId));
  const profileLimit = PROFILE_LIMITS_ACTIVE ? profileLimitForPlan(plan) : null;
  const profilesUsed = usage?.profilesUsed ?? 0;
  return {
    profileLimit,
    profilesUsed,
    profilesRemaining:
      profileLimit === null
        ? null
        : Math.max(profileLimit - profilesUsed, 0),
  };
}