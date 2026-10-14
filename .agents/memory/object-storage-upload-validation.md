---
name: Object storage upload validation
description: Security boundary for user-uploaded public church assets on Replit object storage.
---

Presigned object uploads use caller-declared metadata and are not trusted as image validation. Keep uploaded objects inaccessible by default, namespace paths by the authenticated church, verify stored size, MIME metadata, and file signatures after upload, and expose only the exact database-approved logo through a purpose-specific public route.

**Why:** A signed PUT can contain bytes that do not match the metadata used to request it. Reflecting those objects through a generic same-origin proxy can expose private files, enable cross-tenant asset reuse, or serve attacker-controlled content.

**How to apply:** Use this boundary for every new user-uploaded public asset. Never add a blanket public reader for the private object directory, and never persist or publish an object path before server-side ownership and byte checks pass.

The configured Replit signing interface currently returns host-only signatures; content-type binding was not honored in a signing probe. Native GCS typed signing also failed because the configured external-account signer has no client email.

**Why:** GCS supporting typed signed URLs in general does not mean the configured Replit credential/signing interface can issue them. Silently replacing the existing signer with the native SDK would break anonymous uploads.

**How to apply:** Keep request metadata and stored-byte checks distinct from upload-time guarantees. Do not claim type- or size-bound direct PUTs without inspecting the actual signed headers. Strict upload-time enforcement needs a supported signer or a separately approved bounded upload relay, not a database migration.