---
name: Development database migration workflow
description: How schema changes are applied reliably in this workspace.
---

Use the tracked SQL migration runner for development schema changes rather than relying on an interactive Drizzle push. In this environment, `drizzle-kit push` can stop at a named-schema conflict prompt even with force flags when run without a TTY.

**Why:** The API workflow already runs the migration runner on startup, and tracked migrations are repeatable and non-interactive.

**How to apply:** Add an idempotent SQL file under the database migrations directory, run the database package's migration command, and verify the migration record and target schema.