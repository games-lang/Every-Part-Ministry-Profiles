---
name: Integrated estimate bank alignment
description: Why the integrated time estimate needs bank-aligned question counts without changing scoring.
---

The integrated estimate must count each question once when any of its enabled construct mappings applies, even if it maps to multiple constructs. Keep the compact browser-side count index aligned with the server-owned question bank, and check it against that bank when the questions change. The classic estimate must continue using its separate existing calculation.

**Why:** Summing construct counts double-counts overlapping integrated questions and gives churches misleading estimates when they change enabled sections or gifts. The browser must also preview unsaved Church Setup selections, so it cannot rely only on a started attempt's question list.

**How to apply:** When editing the integrated question bank or its mapping rules, update and run the estimate's bank-alignment test. Once an attempt exists, use its actual question list rather than a configuration-based projection.