---
name: Database concurrency tests
description: Verify cross-worker limits using independent PostgreSQL connections, not queued queries on one client.
---

Use separate, bounded PostgreSQL connections when testing atomic reservations or other cross-worker limits.

**Why:** Queries on one pg client are serialized, so Promise.all on that client does not exercise a real database race. The installed pg client also warns that querying a busy client will become unsupported. With independent connections, lock acquisition order is not guaranteed.

**How to apply:** Allocate fewer connections than the pool maximum, leaving room for setup/cleanup. Use an isolated disposable schema for shared test rows, clean it up in finally, and assert successful counts without assuming the first submitted request won.
