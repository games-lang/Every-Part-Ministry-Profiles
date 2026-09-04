---
name: Vite Radix hot reload
description: How to interpret transient invalid-hook errors after adding a Radix UI primitive to the Vite app.
---

When a previously unused Radix UI primitive is first imported, Vite dependency optimization can transiently produce an invalid-hook-call error during hot reload. Do not treat that hot-reload-only error as proof that the component violates React hook rules.

**Why:** This has occurred with multiple Radix primitives while Vite was re-optimizing dependencies; a full workflow restart loaded the same typechecked and production-built code cleanly.

**How to apply:** After adding a Radix primitive, finish the coherent edit, run typecheck and production build, restart the web workflow once, and judge the fresh browser logs rather than stale pre-restart HMR errors.