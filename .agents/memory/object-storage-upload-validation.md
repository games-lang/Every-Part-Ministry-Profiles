---
name: Object storage upload validation
description: Security boundary for user-uploaded public church assets on Replit object storage.
---

Presigned object uploads use caller-declared metadata and are not trusted as image validation. Keep uploaded objects inaccessible by default, namespace paths by the authenticated church, verify stored size, MIME metadata, and file signatures after upload, and expose only the exact database-approved logo through a purpose-specific public route.

**Why:** A signed PUT can contain bytes that do not match the metadata used to request it. Reflecting those objects through a generic same-origin proxy can expose private files, enable cross-tenant asset reuse, or serve attacker-controlled content.

**How to apply:** Use this boundary for every new user-uploaded public asset. Never add a blanket public reader for the private object directory, and never persist or publish an object path before server-side ownership and byte checks pass.