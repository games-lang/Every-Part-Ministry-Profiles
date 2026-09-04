---
name: Youth profile configuration
description: Safety boundaries for church-specific Discover, Explore, and Develop wording and section visibility.
---

Churches may customize youth-facing profile and section wording and relabel server-owned canonical choices, but must never change the canonical answer identifiers used for validation and results.

Only optional guardian observations may currently be disabled. Identity, age routing, guardian approval, and substantive answer-bearing sections stay mandatory and locked until submission and result contracts explicitly support omitted sections.

**Why:** Hiding a required section without changing validation and result generation would either block submission, invent fake answers, or make completed profiles unreadable.

**How to apply:** Store normalized, versioned youth configuration with the church assessment configuration. Validate all keys against server-owned allowlists, expose only live-consumed settings in the editor, and keep historical submissions unchanged.