---
name: Stripe connector proxy
description: Stripe API-key connections may expose only the Replit connector proxy, not a secret key for the official Stripe SDK.
---

Use the Replit connectors proxy for Stripe application requests when the connected account is API-key based and does not expose secret settings. Do not assume the generic secret-key template will work in every Replit environment.

**Why:** The connected Stripe account successfully supported authenticated API requests through the connector proxy while returning no secret-key fields to application-side credential lookup.

**How to apply:** Keep Stripe API calls server-side through `ReplitConnectors`; validate webhook event IDs by retrieving them through the connected Stripe account before syncing local billing state.