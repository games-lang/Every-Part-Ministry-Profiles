---
name: Production data verification
description: Evidence required before claiming the owner's live data-loading incident is fixed.
---

Verify authenticated production data loading separately from public church lookup and preview authentication. Do not describe a missing underlying database cause as a verified root cause, or a diagnostics-only change as a root-cause fix.

**Why:** The user explicitly requires verification against an authenticated live session. Public requests can recover without any new authenticated request occurring, and the preview Clerk login helper does not establish a production owner session.

**How to apply:** Use an authorized existing production session when available. Otherwise report that limitation and request a fresh reproduction time from the signed-in owner; keep preview checks clearly labeled as preview evidence. Never invent or bypass the owner's identity to meet acceptance criteria.
