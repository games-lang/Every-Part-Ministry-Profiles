import { ReplitConnectors } from "@replit/connectors-sdk";

export type StripeProduct = {
  id: string;
  name: string;
  description: string | null;
  metadata?: Record<string, string>;
};

export type StripePrice = {
  id: string;
  product: string | StripeProduct;
  unit_amount: number | null;
  currency: string;
  recurring?: { interval: string } | null;
  metadata?: Record<string, string>;
};

export type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  created: number;
  metadata?: Record<string, string>;
  items: {
    data: Array<{
      price: string | StripePrice;
      current_period_end?: number;
    }>;
  };
};

type StripeListResponse<T> = {
  data: T[];
  has_more?: boolean;
};

function formBody(values: Record<string, string | number | boolean>) {
  return new URLSearchParams(
    Object.entries(values).map(([key, value]) => [key, String(value)]),
  ).toString();
}

export async function stripeRequest<T>(
  path: string,
  options: { method?: string; body?: string } = {},
): Promise<T> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("stripe", path, {
    method: options.method ?? "GET",
    headers: options.body
      ? { "Content-Type": "application/x-www-form-urlencoded" }
      : undefined,
    body: options.body,
  });
  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Stripe request failed with ${response.status}`,
    );
  }
  return payload;
}

export async function listActivePlans() {
  const response = await stripeRequest<StripeListResponse<StripePrice>>(
    "/v1/prices?active=true&type=recurring&limit=100&expand[0]=data.product",
  );
  return response.data.filter((price) => {
    const product = typeof price.product === "string" ? null : price.product;
    return Boolean(price.metadata?.plan_key ?? product?.metadata?.plan_key);
  });
}

export async function createCustomer(input: {
  name: string;
  email: string;
  churchId: number;
  userId: string;
}) {
  return stripeRequest<{ id: string }>("/v1/customers", {
    method: "POST",
    body: formBody({
      name: input.name,
      email: input.email,
      "metadata[church_id]": input.churchId,
      "metadata[clerk_user_id]": input.userId,
    }),
  });
}

export async function listCustomerSubscriptions(customerId: string) {
  const response = await stripeRequest<StripeListResponse<StripeSubscription>>(
    `/v1/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=20`,
  );
  return response.data;
}

export async function createCheckoutSession(input: {
  customerId: string;
  priceId: string;
  churchId: number;
  planKey: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripeRequest<{ url: string | null }>("/v1/checkout/sessions", {
    method: "POST",
    body: formBody({
      customer: input.customerId,
      mode: "subscription",
      "line_items[0][price]": input.priceId,
      "line_items[0][quantity]": 1,
      allow_promotion_codes: true,
      client_reference_id: input.churchId,
      "subscription_data[metadata][church_id]": input.churchId,
      "subscription_data[metadata][plan_key]": input.planKey,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }),
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripeRequest<{ url: string }>("/v1/billing_portal/sessions", {
    method: "POST",
    body: formBody({ customer: customerId, return_url: returnUrl }),
  });
}

export async function retrieveStripeEvent(eventId: string) {
  return stripeRequest<{
    id: string;
    type: string;
    data: { object: Record<string, unknown> };
  }>(`/v1/events/${encodeURIComponent(eventId)}`);
}

export async function ensureManagedWebhook(url: string) {
  const response = await stripeRequest<StripeListResponse<{ id: string; url: string }>>(
    "/v1/webhook_endpoints?limit=100",
  );
  if (response.data.some((endpoint) => endpoint.url === url)) return;

  await stripeRequest("/v1/webhook_endpoints", {
    method: "POST",
    body: new URLSearchParams({
      url,
      "enabled_events[]": "*",
      description: "Every Part billing synchronization",
    }).toString(),
  });
}