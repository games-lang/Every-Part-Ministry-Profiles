---
name: Integrated adult assessment default rollout
description: Why the pre-launch pilot flag needs a one-time transition rather than only changing a UI fallback.
---

The previous stored `false` value was also the automatic default, so it could not distinguish a deliberate choice of classic from a church that never touched the setting. For this pre-launch switch, existing church flags were moved to integrated while `false` remains the explicit opt-out going forward.

**Why:** A UI-only default change leaves all old churches on classic, because the database populated the old default as a real `false`. There is no reliable way to recover prior intentions from that flag alone.

**How to apply:** If modifying the adult format toggle again, distinguish new explicit classic selections from the pre-launch false/default population; do not repeat a bulk rewrite of false values after churches can opt out. Draft snapshots and saved results must not be rewritten when the church default changes.