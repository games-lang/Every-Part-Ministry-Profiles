import { stripeRequest } from "./stripeClient";

const plans = [
  {
    key: "growing",
    name: "Every Part Growing",
    description: "For a small team beginning a shared ministry conversation.",
    amount: 1000,
  },
  {
    key: "complete",
    name: "Every Part Complete",
    description: "For churches ready for a fuller rhythm of discovery and connection.",
    amount: 2000,
  },
  {
    key: "network",
    name: "Every Part Network",
    description: "For churches and ministry networks growing across multiple contexts.",
    amount: 3000,
  },
  {
    key: "unlimited",
    name: "Every Part Unlimited",
    description: "For churches that want room for every person, without a profile cap.",
    amount: 5000,
  },
] as const;

async function seedProducts() {
  const productsResponse = await stripeRequest<{
    data: Array<{
      id: string;
      metadata?: Record<string, string>;
    }>;
  }>("/v1/products?active=true&limit=100");
  const products = productsResponse.data;

  for (const plan of plans) {
    let product = products.find(
      (candidate) => candidate.metadata?.plan_key === plan.key,
    );
    if (!product) {
      product = await stripeRequest<{ id: string }>("/v1/products", {
        method: "POST",
        body: new URLSearchParams({
          name: plan.name,
          description: plan.description,
          "metadata[plan_key]": plan.key,
          "metadata[app]": "every_part",
        }).toString(),
      });
      console.log(`Created ${plan.name}: ${product.id}`);
    }

    const existingPrices = await stripeRequest<{
      data: Array<{
        id: string;
        unit_amount: number | null;
        metadata?: Record<string, string>;
        recurring?: { interval: string } | null;
      }>;
    }>(`/v1/prices?product=${encodeURIComponent(product.id)}&active=true&type=recurring&limit=100`);
    const existing = existingPrices.data.find(
      (price) =>
        price.metadata?.plan_key === plan.key &&
        price.unit_amount === plan.amount &&
        price.recurring?.interval === "month",
    );
    if (existing) {
      console.log(`${plan.key}: ${existing.id} already exists`);
      continue;
    }

    const price = await stripeRequest<{ id: string }>("/v1/prices", {
      method: "POST",
      body: new URLSearchParams({
        product: product.id,
        unit_amount: String(plan.amount),
        currency: "usd",
        "recurring[interval]": "month",
        lookup_key: `every_part_${plan.key}_monthly`,
        "metadata[plan_key]": plan.key,
        "metadata[app]": "every_part",
      }).toString(),
    });
    console.log(`${plan.key}: created ${price.id}`);
  }
}

seedProducts().catch((error) => {
  console.error(error);
  process.exit(1);
});