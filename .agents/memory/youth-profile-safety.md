---
name: Youth profile safety
description: Durable privacy, routing, and interpretation boundaries for profiles completed by minors.
---

Youth profile pathways must be enforced from exact age at the server boundary, not only through frontend navigation. Any pathway override requires an authenticated administrator of the same church and must remain auditable.

**Why:** Minor profiles use different consent, privacy, and interpretation boundaries than adult Ministry Profiles. A direct URL or crafted request must not turn a child submission into an adult record that can enter adult matching or team workflows.

**How to apply:** Require guardian consent, keep child answers separate from guardian observations, preserve each completed profile as historical reflection, and expose youth summaries only to authorized same-church leaders or through a short-lived opaque guardian result link. Never include youth profiles in AI matching, team suggestions, or adult assignment controls.

Saved youth drafts must be optional, device-expiring, and clearable, with consent excluded from persisted draft data.

**Why:** Automatically retaining a child’s name, guardian contact information, or observations on a shared device can expose one family’s unfinished profile to another.

**How to apply:** Keep persistence off by default, explain the shared-device risk, expire saved drafts quickly, omit blank optional fields, and provide an obvious discard action.

Multi-step youth forms must validate only the visible step during progression and safely validate the complete form at submission; do not run hidden required fields through full-schema validation on every interaction.

**Why:** Full-form validation during early-step interactions can surface expected missing future answers as runtime failures instead of child-friendly inline guidance.

**How to apply:** Use step-scoped, non-throwing checks for Continue actions, then run a complete safe parse before constructing the final strict API payload.

Public youth gates must fail closed while authentication is loading. A child form may mount only after Clerk has explicitly settled as signed in or a server-verified access grant tied to the current church slug has been accepted.

**Why:** Treating an unresolved auth state or stale client grant as access can briefly expose the full child form to an unsigned visitor.

**How to apply:** Render a neutral loading card until Clerk is loaded, compare signed-in state explicitly, and bind any code grant to the exact church route so it cannot survive a slug change.