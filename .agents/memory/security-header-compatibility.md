---
name: Security header compatibility
description: Serving-layer coverage and production-browser exceptions required by the Every Part CSP.
---

Security headers must protect the frontend HTML-serving layer, not just API responses.

**Why:** The prior live frontend used a separate static serving layer; API middleware did not affect its HTML responses. Test the production serving path rather than assuming development Vite headers prove deployed coverage.

**How to apply:** Verify HTML deep links and assets independently of API responses. Preserve header coverage on proxied Clerk responses, whose upstream headers can overwrite application headers.

The user requested `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` on every live page.

**Why:** This is the requested framing boundary, even though it prevents cross-origin church-site assessment embeds.

**How to apply:** Keep external embedding blocked unless the user explicitly revises this requirement. Workspace preview embedding is a separate development concern.

Production-browser checks found existing Replit-injected scripts at i.replit.com, eval execution, and blob workers. Inline styles are also required by the existing React/Clerk UI.

**Why:** Blocking these produced CSP violations on the existing production landing page. The precise source of eval was not isolated; do not assume it is Clerk.

**How to apply:** Tighten these exceptions only after tracing their dependencies and verifying public and auth pages in a browser. Test pending policies with browser-local response interception on the real production origin when production Clerk cannot initialize on an unregistered staging host; do not publish just to test.

Development Clerk domains do not cover the frontend API origin used by a live key.

**Why:** Promoting the app to a live Clerk key exposed a missing custom production frontend API origin and broke sign-in despite earlier development-key checks.

**How to apply:** Verify the actual live-key frontend API origin in script and connection allowlists, plus Clerk image/frame origins when needed. Preserve development entries; passing a development sign-in screen is not proof of production CSP compatibility.
