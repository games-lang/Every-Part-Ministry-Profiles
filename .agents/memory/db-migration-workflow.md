---
name: Development database migration workflow
description: How schema changes are applied reliably in this workspace.
---

Use the tracked SQL migration runner for development schema changes rather than relying on an interactive Drizzle push. In this environment, `drizzle-kit push` can stop at a named-schema conflict prompt even with force flags when run without a TTY.

**Why:** The API workflow already runs the migration runner on startup, and tracked migrations are repeatable and non-interactive.

**How to apply:** Add an idempotent SQL file under the database migrations directory, run the database package's migration command, and verify the migration record and target schema.

Publish schema diffs may schedule a new foreign key before a new supporting composite unique key on an existing table, even when both are present in development.

**Why:** PostgreSQL validates referenced uniqueness when the foreign key is created, so a logically complete but incorrectly ordered diff fails on the production fork.

**How to apply:** Prefer foreign keys backed by keys already present in production, such as a primary key. If the composite database guarantee is essential, introduce its unique constraint in an earlier publish rather than depending on same-publish statement ordering.