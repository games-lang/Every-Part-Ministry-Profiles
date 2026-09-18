---
name: Billing launch availability
description: How EveryPart presents planned pricing before paid subscriptions open
---

EveryPart may show planned plan names, limits, and prices publicly while remaining explicitly not currently for sale. Paid checkout must stay closed in both the interface and the server until launch approval. The active payment-provider integration was removed on 2026-09-18 and is intentionally deferred.

**Why:** Publishing was blocked by live payment-account setup before EveryPart was ready to accept customers. Planned pricing and internal plan limits are still useful without payment processing.

**How to apply:** Keep public pricing copy marked as coming soon and render plan actions as unavailable. Preserve plan-limit and usage behavior independently of payments. Reintroduce a payment provider only through a deliberate billing-launch project, with production account setup and checkout verification.