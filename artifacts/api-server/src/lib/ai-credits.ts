import { and, eq } from "drizzle-orm";
import {
  aiCreditUsageTable,
  churchesTable,
  db,
} from "@workspace/db";

export const AI_CREDIT_LIMITS = {
  starter: 20,
  growing: 150,
  complete: 400,
  network: 1000,
} as const;

type AiCreditPlan = keyof typeof AI_CREDIT_LIMITS;

export class AiCreditsExceededError extends Error {
  constructor(
    readonly plan: AiCreditPlan,
    readonly limit: number,
    readonly creditsUsed: number,
  ) {
    super(
      `This church has used all ${limit} AI credits for its ${planName(plan)} plan. AI credits reset with the next billing month.`,
    );
    this.name = "AiCreditsExceededError";
  }
}

function planName(plan: AiCreditPlan) {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;
}

function normalizedPlan(plan: string): AiCreditPlan {
  return plan in AI_CREDIT_LIMITS
    ? (plan as AiCreditPlan)
    : "starter";
}

function periodFor(plan: string, billingCurrentPeriodEnd: Date | null) {
  const normalized = normalizedPlan(plan);
  if (normalized !== "starter" && billingCurrentPeriodEnd) {
    const periodEnd = new Date(billingCurrentPeriodEnd);
    const periodStart = new Date(periodEnd);
    periodStart.setUTCMonth(periodStart.getUTCMonth() - 1);
    return {
      key: periodEnd.toISOString(),
      start: periodStart,
      end: periodEnd,
    };
  }

  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return {
    key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    start,
    end,
  };
}

export async function reserveAiCredits(churchId: number, credits = 1) {
  if (!Number.isInteger(credits) || credits < 1) {
    throw new Error("AI credit reservation must be a positive integer.");
  }

  return db.transaction(async (tx) => {
    const [church] = await tx
      .select({
        billingPlan: churchesTable.billingPlan,
        billingCurrentPeriodEnd: churchesTable.billingCurrentPeriodEnd,
      })
      .from(churchesTable)
      .where(eq(churchesTable.id, churchId))
      .for("update")
      .limit(1);
    if (!church) throw new Error("Church not found");

    const plan = normalizedPlan(church.billingPlan);
    const period = periodFor(plan, church.billingCurrentPeriodEnd);
    let [usage] = await tx
      .select()
      .from(aiCreditUsageTable)
      .where(
        and(
          eq(aiCreditUsageTable.churchId, churchId),
          eq(aiCreditUsageTable.periodKey, period.key),
        ),
      )
      .limit(1);

    if (!usage || usage.periodKey !== period.key) {
      [usage] = await tx
        .insert(aiCreditUsageTable)
        .values({
          churchId,
          periodKey: period.key,
          periodStart: period.start,
          periodEnd: period.end,
          creditsUsed: 0,
        })
        .onConflictDoNothing({
          target: [
            aiCreditUsageTable.churchId,
            aiCreditUsageTable.periodKey,
          ],
        })
        .returning();
      if (!usage) {
        [usage] = await tx
          .select()
          .from(aiCreditUsageTable)
          .where(
            and(
              eq(aiCreditUsageTable.churchId, churchId),
              eq(aiCreditUsageTable.periodKey, period.key),
            ),
          )
          .limit(1);
      }
    }

    const limit = AI_CREDIT_LIMITS[plan];
    const creditsUsed = usage?.creditsUsed ?? 0;
    if (creditsUsed + credits > limit) {
      throw new AiCreditsExceededError(plan, limit, creditsUsed);
    }

    const [updated] = await tx
      .update(aiCreditUsageTable)
      .set({
        creditsUsed: creditsUsed + credits,
        updatedAt: new Date(),
      })
      .where(eq(aiCreditUsageTable.id, usage!.id))
      .returning();
    return {
      plan,
      aiCreditLimit: limit,
      creditsUsed: updated?.creditsUsed ?? creditsUsed + credits,
      creditsRemaining: Math.max(
        limit - (updated?.creditsUsed ?? creditsUsed + credits),
        0,
      ),
      periodEnd: period.end,
    };
  });
}

export async function getAiCreditUsage(
  churchId: number,
  plan: string,
  billingCurrentPeriodEnd: Date | null,
) {
  const normalized = normalizedPlan(plan);
  const period = periodFor(normalized, billingCurrentPeriodEnd);
  const [usage] = await db
    .select({ creditsUsed: aiCreditUsageTable.creditsUsed })
    .from(aiCreditUsageTable)
    .where(
      and(
        eq(aiCreditUsageTable.churchId, churchId),
        eq(aiCreditUsageTable.periodKey, period.key),
      ),
    )
    .limit(1);
  const creditsUsed = usage?.creditsUsed ?? 0;
  const creditLimit = AI_CREDIT_LIMITS[normalized];
  return {
    aiCreditLimit: creditLimit,
    aiCreditsUsed: creditsUsed,
    aiCreditsRemaining: Math.max(creditLimit - creditsUsed, 0),
    aiCreditPeriodEnd: period.end,
  };
}