---
name: Pnpm workspace relinking
description: A dependency installation quirk that can break unrelated API imports after a filtered package add.
---

After adding a dependency to one workspace package, if the API build suddenly cannot resolve an unrelated dependency that is still declared in its library package, check whether the library's `node_modules` symlink points to a missing pnpm store directory. Run a full workspace `pnpm install --frozen-lockfile` to relink packages before changing application code.

**Why:** A filtered frontend dependency add updated the lockfile's peer-dependency resolution, but left an older OpenAI library symlink pointing to a removed store variant. The API workflow failed to bundle until a full frozen install repaired the link.

**How to apply:** Use this when a filtered pnpm add succeeds but a subsequent build reports an otherwise declared package as missing. Confirm the symlink is stale first; do not work around it by changing API imports or adding a duplicate dependency.