---
name: Profile print privacy
description: Intentional inclusion and exclusion boundaries for signed-in profile print and PDF output.
---

Print and PDF output must omit coordinator-only guidance, volunteered life experiences, full gift reflections, and operational controls. Spiritual Health is an intentional exception and remains in the printed profile. Adult printing always uses the dedicated individual infographic regardless of which screen tab is active, and only self-named ministry interests may appear as places to explore.

**Why:** The user explicitly confirmed that Spiritual Health should stay available in print while the other sensitive and coordinator-only sections remain excluded from the actual print render tree.

**How to apply:** Preserve the on-screen signed-in profile view. When adding print behavior or new sensitive sections, make inclusion an explicit render-tree decision rather than relying only on print CSS. Gate every printed field through the profile’s saved section and subsection configuration.