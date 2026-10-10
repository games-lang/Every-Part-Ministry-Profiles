---
name: Integrated adult assessment default rollout
description: Why the pre-launch pilot flag needs a one-time transition rather than only changing a UI fallback.
---

New adult starts must now use integrated, regardless of the stored pilot flag. The user asked to hide classic, not delete it: retain classic banks, flow and scoring for later re-exposure, along with original-format in-flight assessments and historical results.

**Why:** The user chose integrated as the only new-start format while explicitly requiring stored flags and saved data to remain unchanged. The previous stored `false` value once represented both an automatic default and later an explicit classic opt-out; neither should gate new integrated starts now.

**How to apply:** Remove all participant classic-selection and fallback paths, not just the setup toggle. Check the server's start gate too. Never bulk-rewrite stored flags or draft/result snapshots. Preserve the original flow of an already-running assessment; only fresh starts use integrated.