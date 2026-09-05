---
name: Church branding persistence
description: The save boundary for church logos and colors in the combined setup experience.
---

Church logo and color changes must be saved independently from the rest of church and assessment configuration.

**Why:** The combined setup form can contain an invalid field on another, hidden tab. Requiring that entire form to validate made branding appear to upload correctly while silently preventing its persistence.

**How to apply:** Keep a dedicated branding save action that sends only the logo path and color values, validates those values locally, and confirms success or failure visibly.