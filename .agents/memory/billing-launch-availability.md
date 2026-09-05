---
name: Billing launch availability
description: How EveryPart presents planned pricing before paid subscriptions open
---

EveryPart may show planned plan names, limits, and prices publicly while remaining explicitly not currently for sale. Paid checkout must stay closed in both the interface and the server until launch approval.

**Why:** The Stripe connection and plan catalog can exist in test mode before EveryPart is ready to accept customers, so displaying prices must not imply that payment is available.

**How to apply:** Keep public pricing copy marked as coming soon and render plan actions as unavailable. Gate the checkout endpoint closed by default; only enable it through the deliberate billing launch configuration. 