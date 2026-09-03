import { Router, type IRouter, type Request } from "express";
import {
  CreateBillingCheckoutBody,
  CreateBillingCheckoutResponse,
  CreateBillingPortalResponse,
  GetBillingPlansResponse,
  GetBillingSubscriptionResponse,
} from "@workspace/api-zod";
import { db, churchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import {
  createCheckoutSession,
  createCustomer,
  createPortalSession,
  listActivePlans,
  listCustomerSubscriptions,
} from "../stripeClient";
import {
  getProfileUsage,
  profileLimitForPlan,
} from "../lib/profile-limits";
import {
  AI_CREDIT_LIMITS,
  getAiCreditUsage,
} from "../lib/ai-credits";

const router: IRouter = Router();
const paidPlanKeys = ["growing", "complete", "network"] as const;
type PaidPlanKey = (typeof paidPlanKeys)[number];

const planDescriptions: Record<PaidPlanKey, string> = {
  growing: "For a small team beginning a shared ministry conversation.",
  complete: "For churches ready for a fuller rhythm of discovery and connection.",
  network: "For churches and ministry networks growing across multiple contexts.",
};

function isPaidPlanKey(value: string): value is PaidPlanKey {
  return paidPlanKeys.includes(value as PaidPlanKey);
}

function planKeyForPrice(
  price: Awaited<ReturnType<typeof listActivePlans>>[number],
) {
  const product = typeof price.product === "string" ? null : price.product;
  const key = price.metadata?.plan_key ?? product?.metadata?.plan_key;
  return key && isPaidPlanKey(key) ? key : null;
}

function appOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0] || req.protocol;
  const basePath = (process.env.BASE_PATH ?? "").replace(/\/$/, "");
  return `${protocol}://${req.get("host")}${basePath}`;
}

async function syncChurchSubscription(
  church: Awaited<ReturnType<typeof getOrCreateChurch>>,
) {
  if (!church.stripeCustomerId) {
    return {
      plan: "starter" as const,
      status: "inactive",
      hasPaidAccess: false,
      currentPeriodEnd: null,
    };
  }

  const subscriptions = await listCustomerSubscriptions(church.stripeCustomerId);
  const subscription = subscriptions
    .filter((candidate) => candidate.status !== "canceled")
    .sort((a, b) => b.created - a.created)[0];

  if (!subscription) {
    await db
      .update(churchesTable)
      .set({
        billingPlan: "starter",
        billingStatus: "inactive",
        stripeSubscriptionId: null,
        stripePriceId: null,
        billingCurrentPeriodEnd: null,
      })
      .where(eq(churchesTable.id, church.id));
    return {
      plan: "starter" as const,
      status: "inactive",
      hasPaidAccess: false,
      currentPeriodEnd: null,
    };
  }

  const item = subscription.items.data[0];
  const priceId = typeof item?.price === "string" ? item.price : item?.price.id;
  const metadataPlan = subscription.metadata?.plan_key;
  const plan =
    metadataPlan && isPaidPlanKey(metadataPlan) ? metadataPlan : "growing";
  const currentPeriodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;

  await db
    .update(churchesTable)
    .set({
      billingPlan: plan,
      billingStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId ?? null,
      billingCurrentPeriodEnd: currentPeriodEnd,
    })
    .where(eq(churchesTable.id, church.id));

  return {
    plan,
    status: subscription.status,
    hasPaidAccess: ["active", "trialing"].includes(subscription.status),
    currentPeriodEnd,
  };
}

router.get("/billing/plans", async (_req, res): Promise<void> => {
  try {
    const prices = await listActivePlans();
    const plans = paidPlanKeys
      .map((key) => {
        const price = prices.find((candidate) => planKeyForPrice(candidate) === key);
        const product =
          price && typeof price.product === "object" ? price.product : null;
        if (!price || !product) return null;
        return {
          key,
          name: product.name,
          description: planDescriptions[key],
          monthlyPrice: price.unit_amount ?? 0,
          profileLimit: profileLimitForPlan(key),
          aiCreditLimit: AI_CREDIT_LIMITS[key],
          priceId: price.id,
        };
      })
      .filter((plan): plan is NonNullable<typeof plan> => Boolean(plan));

    res.json(GetBillingPlansResponse.parse({ plans }));
  } catch (error) {
    console.error("Unable to load Stripe billing plans", error);
    res.status(503).json({ error: "Billing plans are temporarily unavailable." });
  }
});

router.get("/billing/subscription", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const church = await getOrCreateChurch(userId);
    const subscription = await syncChurchSubscription(church);
    const usage = await getProfileUsage(church.id, subscription.plan);
    const aiUsage = await getAiCreditUsage(
      church.id,
      subscription.plan,
      subscription.currentPeriodEnd,
    );
    res.json(
      GetBillingSubscriptionResponse.parse({
        ...subscription,
        ...usage,
        ...aiUsage,
      }),
    );
  } catch (error) {
    console.error("Unable to load church billing status", error);
    res.status(503).json({ error: "Billing status is temporarily unavailable." });
  }
});

router.post("/billing/checkout", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = CreateBillingCheckoutBody.safeParse(req.body);
  if (!parsed.success || !isPaidPlanKey(parsed.data.plan)) {
    res.status(400).json({ error: "Please choose a valid paid plan." });
    return;
  }

  try {
    const church = await getOrCreateChurch(userId);
    const existing = await syncChurchSubscription(church);
    if (existing.hasPaidAccess) {
      res.status(400).json({
        error:
          "Your church already has an active paid plan. Use Manage billing to change it.",
      });
      return;
    }

    const prices = await listActivePlans();
    const price = prices.find(
      (candidate) => planKeyForPrice(candidate) === parsed.data.plan,
    );
    if (!price) {
      res.status(503).json({ error: "That plan is not available yet." });
      return;
    }

    let customerId = church.stripeCustomerId;
    if (!customerId) {
      const customer = await createCustomer({
        name: church.name,
        email: church.adminEmail,
        churchId: church.id,
        userId,
      });
      customerId = customer.id;
      await db
        .update(churchesTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(churchesTable.id, church.id));
    }

    const origin = appOrigin(req);
    const session = await createCheckoutSession({
      customerId,
      priceId: price.id,
      churchId: church.id,
      planKey: parsed.data.plan,
      successUrl: `${origin}/billing?checkout=success`,
      cancelUrl: `${origin}/billing?checkout=cancelled`,
    });
    if (!session.url) {
      res.status(503).json({ error: "Stripe did not return a checkout URL." });
      return;
    }

    res.json(CreateBillingCheckoutResponse.parse({ url: session.url }));
  } catch (error) {
    console.error("Unable to create Stripe checkout session", error);
    res.status(503).json({ error: "Checkout is temporarily unavailable." });
  }
});

router.post("/billing/portal", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const church = await getOrCreateChurch(userId);
    if (!church.stripeCustomerId) {
      res.status(400).json({ error: "No billing account exists yet." });
      return;
    }

    const session = await createPortalSession(
      church.stripeCustomerId,
      `${appOrigin(req)}/billing`,
    );
    res.json(CreateBillingPortalResponse.parse({ url: session.url }));
  } catch (error) {
    console.error("Unable to create Stripe billing portal session", error);
    res.status(503).json({ error: "Billing management is temporarily unavailable." });
  }
});

export default router;