---
name: Profile removal integrity
description: Keeping remaining profiles and church counts intact during permanent removal.
---

After a confirmed profile deletion, update cached plan usage immediately and refresh directory, dashboard, team, and owner-audit data. Do not refetch the deleted profile detail while its confirmation dialog is still mounted; clear its cache after navigating away.

**Why:** An inactive Plan & usage query can otherwise show an old count on the next navigation, and refetching an active just-deleted detail produces an avoidable 404 during dialog closure.

**How to apply:** Preserve server-side role and church scoping as the source of authority. Make cache updates only after the deletion succeeds, and let server refetches reconcile the aggregate numbers.

A ministry journey may belong to more than one completed profile. Remove its entries only after its last linked profile is removed.

**Why:** Removing a shared journey cascades its entries and unlinks surviving profiles, silently destroying history for someone who was not selected for removal.

**How to apply:** When deleting a profile or linked person, check for surviving profiles before deleting the journey; preserve their results, invitations, and journey records.