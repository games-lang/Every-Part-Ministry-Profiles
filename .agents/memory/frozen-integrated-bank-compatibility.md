---
name: Frozen integrated bank compatibility
description: Why edits to new integrated questions must not silently invalidate saved attempts or completed profiles.
---

For question wording, ordering, or count changes that leave the scoring contract intact, preserve the existing accepted integrated bank version identifier. Only introduce a new identifier together with explicit backward-compatible handling for old snapshots and completed results.

**Why:** Completed profiles and resumable drafts freeze their original questions. Scoring and downstream signals enforce the bank version; a simple version rename would reject old drafts or make existing result signals disappear even though their stored question mappings remain valid. The historical identifier may name the original bank size rather than today's size.

**How to apply:** Before changing the integrated bank version, test that old drafts still submit and old results still supply signals. Keep the existing identifier for compatible question-bank curation, and do not infer current question count from its name.