import { Router, type IRouter } from "express";
import Stripe from "stripe";
import {
  CreateBillingCheckoutBody,
  GetBillingPlansResponse,
  GetBillingSubscriptionResponse,
  CreateBillingCheckoutResponse,
  CreateBillingPortalResponse,
} from "@workspace/api-zod";
import { db, churchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireUserId } from "../lib/auth";
import { getOrCreateChurch } from "../lib/churches";
import { getUncachableStripeClient } from "../stripeClient";

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

function appOrigin(req: Parameters<Parameters<IRouter["get"]>[1]>[0]) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0] || req.protocol;
  const basePath = (process.env.BASE_PATH ?? "").replace(/\/$/, "");
  return `${protocol}://${req.get("host")}${basePath}`;
}

async function activeRecurringPrices(stripe: Stripe) {
  const prices = await stripe.prices.list({
    active: true,
    type: "recurring",
    limit: 100,
    expand: ["data.product"],
  });

  return prices.data.filter((price) => {
    const product = typeof price.product === "string" ? null : price.product;
    const planKey = price.metadata?.plan_key ?? product?.metadata?.plan_key;
    return planKey && isPaidPlanKey(planKey);
  });
}

async function priceForPlan(stripe: Stripe, plan: PaidPlanKey) {
  const prices = await activeRecurringPrices(stripe);
  return prices.find((price) => {
    const product = typeof price.product === "string" ? null : price.product;
    return (
      price.metadata?.plan_key === plan ||
      product?.metadata?.plan_key === plan
    );
  });
}

async function syncChurchSubscription(
  church: Awaited<ReturnType<typeof getOrCreateChurch>>,
  stripe: Stripe,
) {
  if (!church.stripeCustomerId) {
    return {
      plan: "starter" as const,
      status: "inactive",
      hasPaidAccess: false,
      currentPeriodEnd: null,
    };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: church.stripeCustomerId,
    status: "all",
    limit: 20,
    expand: ["data.items.data.price.product"],
  });
  const subscription = subscriptions.data
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

  const price = subscription.items.data[0]?.price;
  const product =
    price && typeof price.product === "object" ? price.product : null;
  const planKey =
    price?.metadata?.plan_key ?? product?.metadata?.plan_key ?? "growing";
  const plan = isPaidPlanKey(planKey) ? planKey : "growing";
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  await db
    .update(churchesTable)
    .set({
      billingPlan: plan,
      billingStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      stripePriceId: price?.id ?? null,
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
    const stripe = await getUncachableStripeClient();
    const prices = await activeRecurringPrices(stripe);
    const plans = paidPlanKeys
      .map((key) => {
        const price = prices.find((candidate) => {
          const product =
            typeof candidate.product === "string" ? null : candidate.product;
          return (
            candidate.metadata?.plan_key === key ||
            product?.metadata?.plan_key === key
          );
        });
        const product =
          price && typeof price.product === "object" ? price.product : null;
        if (!price || !product) return null;
        return {
          key,
          name: product.name,
          description: planDescriptions[key],
          monthlyPrice: price.unit_amount ?? 0,
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
    const stripe = await getUncachableStripeClient();
    const subscription = await syncChurchSubscription(church, stripe);
    res.json(GetBillingSubscriptionResponse.parse(subscription));
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
    const stripe = await getUncachableStripeClient();
    const existing = await syncChurchSubscription(church, stripe);
    if (existing.hasPaidAccess) {
      res.status(400).json({
        error: "Your church already has an active paid plan. Use Manage billing to change it.",
      });
      return;
    }

    let customerId = church.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: church.name,
        email: church.adminEmail,
        metadata: { church_id: String(church.id), clerk_user_id: userId },
      });
      customerId = customer.id;
      await db
        .update(churchesTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(churchesTable.id, church.id));
    }

    const price = await priceForPlan(stripe, parsed.data.plan);
    if (!price) {
      res.status(503).json({ error: "That plan is not available yet." });
      return;
    }

    const origin = appOrigin(req);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: String(church.id),
      subscription_data: {
        metadata: {
          church_id: String(church.id),
          plan_key: parsed.data.plan,
        },
      },
      success_url: `${origin}/billing?checkout=success`,
      cancel_url: `${origin}/billing?checkout=cancelled`,
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

    const stripe = await getUncachableStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: church.stripeCustomerId,
      return_url: `${appOrigin(req)}/billing`,
    });
    res.json(CreateBillingPortalResponse.parse({ url: session.url }));
  } catch (error) {
    console.error("Unable to create Stripe billing portal session", error);
    res.status(503).json({ error: "Billing management is temporarily unavailable." });
  }
});

export default router;