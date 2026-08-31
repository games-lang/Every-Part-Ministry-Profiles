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