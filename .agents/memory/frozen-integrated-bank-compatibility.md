---
name: Frozen integrated bank compatibility
description: Why edits to new integrated questions must not silently invalidate saved attempts or completed profiles.
---

Version approved question-bank revisions while continuing to accept earlier compatible versions for frozen snapshots and completed results. Never replace the accepted version outright or rebuild an old attempt from today's bank.

**Why:** Completed profiles and resumable drafts freeze their original questions. Scoring and downstream signals enforce the bank version; a simple version rename would reject old drafts or make existing result signals disappear even though their stored question mappings remain valid. The historical identifier may name the original bank size rather than today's size.

**How to apply:** Label fresh snapshots with the bank's current version, extend both server and browser version acceptance, and test that old persisted drafts still resume and submit while old results still supply signals. Keep scoring-version and eligibility thresholds unchanged for editorial revisions, and do not infer current question count from the version name.