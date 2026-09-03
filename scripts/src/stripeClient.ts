import Stripe from "stripe";

async function getStripeSecretKey(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;
  if (!hostname || !xReplitToken) {
    throw new Error("Stripe integration environment is unavailable.");
  }

  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
    },
  );
  if (!response.ok) throw new Error(`Failed to fetch Stripe credentials: ${response.status}`);
  const data = (await response.json()) as {
    items?: Array<{ settings?: { secret_key?: string } }>;
  };
  const secretKey = data.items?.[0]?.settings?.secret_key;
  if (!secretKey) throw new Error("Stripe secret key is missing.");
  return secretKey;
}

export async function getUncachableStripeClient() {
  return new Stripe(await getStripeSecretKey());
}