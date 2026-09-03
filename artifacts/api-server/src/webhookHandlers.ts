import { db, churchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  listCustomerSubscriptions,
  retrieveStripeEvent,
  type StripeSubscription,
} from "./stripeClient";

function planFromSubscription(subscription: StripeSubscription) {
  const plan = subscription.metadata?.plan_key;
  return plan === "growing" || plan === "complete" || plan === "network"
    ? plan
    : "starter";
}

async function syncCustomer(customerId: string) {
  const subscriptions = await listCustomerSubscriptions(customerId);
  const subscription = subscriptions
    .filter((candidate) => candidate.status !== "canceled")
    .sort((a, b) => b.created - a.created)[0];
  const [church] = await db
    .select()
    .from(churchesTable)
    .where(eq(churchesTable.stripeCustomerId, customerId))
    .limit(1);

  if (!church) return;

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
    return;
  }

  const item = subscription.items.data[0];
  const priceId = typeof item?.price === "string" ? item.price : item?.price.id;
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;
  await db
    .update(churchesTable)
    .set({
      billingPlan: planFromSubscription(subscription),
      billingStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId ?? null,
      billingCurrentPeriodEnd: periodEnd,
    })
    .where(eq(churchesTable.id, church.id));
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error("Stripe webhook payload must be a raw Buffer.");
    }

    const incoming = JSON.parse(payload.toString("utf8")) as { id?: string };
    if (!incoming.id) throw new Error("Stripe webhook event id is missing.");

    // The connector proxy verifies the event against the connected Stripe
    // account. We use the verified event as the source of truth instead of
    // trusting request-body fields supplied by the webhook caller.
    const event = await retrieveStripeEvent(incoming.id);
    const object = event.data.object;
    const customerId =
      typeof object.customer === "string"
        ? object.customer
        : typeof object.customer === "object" &&
            object.customer !== null &&
            "id" in object.customer
          ? String(object.customer.id)
          : null;

    if (
      event.type === "checkout.session.completed" &&
      typeof object.client_reference_id === "string"
    ) {
      const churchId = Number(object.client_reference_id);
      if (Number.isInteger(churchId)) {
        const customer =
          typeof object.customer === "string" ? object.customer : null;
        if (customer) {
          await db
            .update(churchesTable)
            .set({ stripeCustomerId: customer })
            .where(eq(churchesTable.id, churchId));
          await syncCustomer(customer);
        }
      }
      return;
    }

    if (
      customerId &&
      (event.type.startsWith("customer.subscription.") ||
        event.type === "invoice.paid" ||
        event.type === "invoice.payment_failed")
    ) {
      await syncCustomer(customerId);
    }
  }
}