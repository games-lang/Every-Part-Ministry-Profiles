import { ReplitConnectors } from "@replit/connectors-sdk";

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
  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Stripe request failed with ${response.status}`,
    );
  }
  return payload;
}