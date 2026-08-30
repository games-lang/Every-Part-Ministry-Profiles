---
name: Church team assignments
description: Durable product and integrity boundaries for organizing Ministry Profiles into church teams and sharing church access with multiple pastor admins.
---

Each completed Ministry Profile may have one current team assignment. Assignments are pastor-led, may be changed or removed, and must never be inferred or applied automatically from assessment or AI matching results. Archiving a team is non-destructive and preserves its existing member assignments.

**Why:** Teams are a practical next step for pastoral discernment, not an automated placement system or serving-history model. Preserving assignments when a team is archived avoids silently losing organizational context.

**How to apply:** Keep team and profile writes scoped to the same church at both the API and database levels. Do not add multi-team membership, automatic assignment, scheduling, messaging, or team task tracking without a new explicit product decision.

Church access is a separate membership relation keyed by Clerk user ID. The original church owner remains the protected owner, while other existing Clerk users can be added or removed as pastor admins.

**Why:** Clerk does not provide organization tenants in this setup, so application-level memberships are required for multiple pastors to share one church without weakening tenant scoping.

**How to apply:** Resolve admin additions through Clerk on the server, scope every church query through the membership lookup, and never allow removal of the owner.