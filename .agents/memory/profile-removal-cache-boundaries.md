---
name: Profile removal cache boundaries
description: Keeping the church dashboard coherent during permanent profile deletion.
---

After a confirmed profile deletion, update cached plan usage immediately and refresh directory, dashboard, team, and owner-audit data. Do not refetch the deleted profile detail while its confirmation dialog is still mounted; clear its cache after navigating away.

**Why:** An inactive Plan & usage query can otherwise show an old count on the next navigation, and refetching an active just-deleted detail produces an avoidable 404 during dialog closure.

**How to apply:** Preserve server-side role and church scoping as the source of authority. Make cache updates only after the deletion succeeds, and let server refetches reconcile the aggregate numbers.