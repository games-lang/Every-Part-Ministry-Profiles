---
name: CEO church console boundaries
description: The privacy and billing boundaries for the EveryPart platform-owner church management console.
---

The EveryPart CEO console may list churches, show aggregate activity counts, review church administrators, open public church profiles, and edit safe church contact and Early Access fields. It must not expose individual member records, youth responses, or profile details. Billing plan and subscription state remain read-only until any future billing action is implemented through Stripe's supported flow.

**Why:** Platform-owner visibility is useful for caring for churches, but member-level ministry data and manually changing billing state create unnecessary privacy and synchronization risk.

**How to apply:** Keep new CEO church endpoints protected by the app-admin allowlist, return aggregates rather than profile rows, and route future billing changes through Stripe rather than direct database edits.