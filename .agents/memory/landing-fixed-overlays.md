---
name: Landing-page fixed overlays
description: Captures a rendering quirk affecting floating controls on the public landing page.
---

Floating launchers and other viewport overlays must render outside the landing page’s overflow container and use explicit fixed positioning with a high stacking level.

**Why:** A chatbot launcher compiled and existed in the page but was absent in desktop and mobile visual previews when it relied only on utility positioning inside the landing container. Moving it outside was insufficient until viewport positioning was explicit.

**How to apply:** Mount future floating controls as siblings of the landing container, not descendants, and visually verify their fixed position at both desktop and mobile viewport sizes.