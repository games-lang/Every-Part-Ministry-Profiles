---
name: Clerk query cache hydration
description: Prevent protected React Query data from disappearing during Clerk's initial browser-session hydration.
---

Do not clear the authenticated query cache when Clerk initially hydrates from a temporary signed-out state to the browser's signed-in user. Clear user-scoped state when a known user signs out or when one known user changes to another.

**Why:** Clerk may emit a null user before restoring the current session. Clearing React Query after protected pages mount can erase successful data and leave mounted consumers with neither loading state nor data.

**How to apply:** Treat the first listener value and an initial null-to-user transition as hydration. Protected queries should also provide bounded retries and an explicit retry state when no usable data is available.