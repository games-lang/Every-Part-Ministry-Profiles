import { Router, type IRouter } from "express";
import {
  GetBillingPlansResponse,
  GetBillingSubscriptionResponse,
} from "@workspace/api-zod";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import {
  getProfileUsage,
  profileLimitForPlan,
} from "../lib/profile-limits";
import {
  AI_CREDIT_LIMITS,
  getAiCreditUsage,
} from "../lib/ai-credits";

const router: IRouter = Router();
const paidPlanKeys = ["growing", "complete", "network", "unlimited"] as const;
type PaidPlanKey = (typeof paidPlanKeys)[number];

const plannedPlans: Record<
  PaidPlanKey,
  { name: string; description: string; monthlyPrice: number }
> = {
  growing: {
    name: "Growing",
    description: "For a small team beginning a shared ministry conversation.",
    monthlyPrice: 1000,
  },
  complete: {
    name: "Complete",
    description:
      "For churches ready for a fuller rhythm of discovery and connection.",
    monthlyPrice: 2000,
  },
  network: {
    name: "Network",
    description:
      "For churches and ministry networks growing across multiple contexts.",
    monthlyPrice: 3000,
  },
  unlimited: {
    name: "Unlimited",
    description:
      "For churches that want room for every person, without a profile cap.",
    monthlyPrice: 5000,
  },
};

router.get("/billing/plans", async (_req, res): Promise<void> => {
  const plans = paidPlanKeys.map((key) => ({
    key,
    ...plannedPlans[key],
    profileLimit: profileLimitForPlan(key),
    aiCreditLimit: AI_CREDIT_LIMITS[key],
    priceId: `planned-${key}`,
  }));
  res.json(GetBillingPlansResponse.parse({ plans }));
});

router.get("/billing/subscription", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const church = await getOrCreateChurch(userId);
    const plan =
      church.billingPlan === "growing" ||
      church.billingPlan === "complete" ||
      church.billingPlan === "network" ||
      church.billingPlan === "unlimited"
        ? church.billingPlan
        : "starter";
    const usage = await getProfileUsage(church.id, plan);
    const aiUsage = await getAiCreditUsage(
      church.id,
      plan,
      church.billingCurrentPeriodEnd,
    );
    res.json(
      GetBillingSubscriptionResponse.parse({
        plan,
        status: church.billingStatus,
        hasPaidAccess: ["active", "trialing"].includes(church.billingStatus),
        currentPeriodEnd: church.billingCurrentPeriodEnd,
        ...usage,
        ...aiUsage,
      }),
    );
  } catch (error) {
    console.error("Unable to load church billing status", error);
    res.status(503).json({ error: "Billing status is temporarily unavailable." });
  }
});

export default router;