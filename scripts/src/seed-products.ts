import { getUncachableStripeClient } from "./stripeClient";

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
] as const;

async function seedProducts() {
  const stripe = await getUncachableStripeClient();
  const products = await stripe.products.list({ active: true, limit: 100 });

  for (const plan of plans) {
    let product = products.data.find(
      (candidate) => candidate.metadata?.plan_key === plan.key,
    );
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { plan_key: plan.key, app: "every_part" },
      });
      console.log(`Created ${plan.name}: ${product.id}`);
    }

    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: "recurring",
      limit: 100,
    });
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

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: `every_part_${plan.key}_monthly`,
      metadata: { plan_key: plan.key, app: "every_part" },
    });
    console.log(`${plan.key}: created ${price.id}`);
  }
}

seedProducts().catch((error) => {
  console.error(error);
  process.exit(1);
});