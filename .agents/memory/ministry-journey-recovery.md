---
name: Ministry journey recovery
description: How profile submissions should handle stale or church-mismatched journey tokens saved in the browser.
---

An otherwise valid profile submission must not fail because its optional saved journey token is stale, deleted, or belongs to another church. Treat an unrecognized token as a request to begin a new journey.

**Why:** Journey tokens are browser continuity hints, not assessment answers or authorization. A shared browser can retain a valid-looking token after switching churches or after journey data changes.

**How to apply:** Preserve an existing same-church journey when the token resolves. If it does not resolve, create a new journey and return its token with the successful profile response.