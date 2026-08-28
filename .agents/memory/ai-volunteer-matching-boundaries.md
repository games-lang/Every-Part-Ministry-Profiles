---
name: AI volunteer matching boundaries
description: Privacy and trust rules for using Ministry Profiles in AI-assisted volunteer matching.
---

AI may prioritize only same-church candidate IDs that already have locally verified evidence for the ministry need. Send the model structured reflection labels and boolean experience-presence signals only; never send names, contact details, demographics, spiritual-health answers, life experiences, or free-text profile responses. Generate every displayed reason locally from verified evidence, deduplicate model IDs, and blend model scores with deterministic scores.

**Why:** Ministry Profiles contain pastoral and potentially identifying free text. Model-generated reasons can be fabricated or manipulated by prompt injection, while evidence-qualified local reasons keep recommendations explainable and advisory.

**How to apply:** Use these boundaries for any volunteer-search prompt, ranking change, new provider, or expansion of fields considered by the matcher. Treat AI output as a bounded prioritization signal, never as placement, calling, willingness, or certainty.