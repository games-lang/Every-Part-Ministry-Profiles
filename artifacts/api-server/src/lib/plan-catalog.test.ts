import assert from "node:assert/strict";
import test from "node:test";
import { AI_CREDIT_LIMITS } from "./ai-credits";
import { planCatalog, planOrder } from "./plan-catalog";
import { PROFILE_LIMITS } from "./profile-limits";

test("planned monthly and annual prices match the approved catalog", () => {
  assert.deepEqual(planCatalog.map((plan) => plan.key), planOrder);
  assert.deepEqual(
    planCatalog.map(({ monthlyPrice, annualPrice }) => [monthlyPrice, annualPrice]),
    [[0, 0], [1000, 10000], [2000, 20000], [3000, 30000], [5000, 50000]],
  );
});

test("catalog preserves existing limits, credits, and common features", () => {
  for (const plan of planCatalog) {
    assert.equal(plan.profileLimit, PROFILE_LIMITS[plan.key]);
    assert.equal(plan.aiCreditLimit, AI_CREDIT_LIMITS[plan.key]);
    assert.ok(Object.values(plan.featureFlags).every(Boolean));
    assert.equal(plan.priceId, null);
  }
});