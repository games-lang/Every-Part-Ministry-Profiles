import { Router, type IRouter } from "express";
import {
  GetBillingPlansResponse,
  GetBillingSubscriptionResponse,
} from "@workspace/api-zod";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import { getProfileUsage } from "../lib/profile-limits";
import { getAiCreditUsage } from "../lib/ai-credits";
import { planCatalog } from "../lib/plan-catalog";

const router: IRouter = Router();

router.get("/billing/plans", async (_req, res): Promise<void> => {
  res.json(GetBillingPlansResponse.parse({ plans: planCatalog }));
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
    req.log.error({ error }, "Unable to load church billing status");
    res.status(503).json({ error: "Billing status is temporarily unavailable." });
  }
});

export default router;