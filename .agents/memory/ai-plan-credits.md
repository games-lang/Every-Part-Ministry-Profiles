---
name: AI plan credits
description: Plan allowances, reset boundaries, and which AI activity belongs to a church’s credit pool.
---

Authenticated church AI actions use one shared monthly allowance: Starter 20, Growing 150, Complete 400, and Network 1,000. One leader request consumes one credit. Paid plans reset with the Stripe billing period; Starter uses a calendar-month period. Credits do not roll over.

The public Every Part guide is not charged to a church because it has no authenticated church context. It remains protected by its independent public rate limit.

**Why:** A church-level allowance must be enforceable without guessing which tenant an anonymous visitor belongs to. A single request-based unit also keeps limits understandable while actual usage is still being learned.

**How to apply:** Reserve credits server-side before authenticated PartFinder, profile-helper, and volunteer-matching requests. When exhausted, block only AI actions with a clear reset message; never restrict access to saved profiles or non-AI functionality.