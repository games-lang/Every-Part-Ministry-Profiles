---
name: Web SSR test JSX mode
description: Direct Node-based rendering tests need a different JSX transform from the web app's Vite build.
---

Run direct TSX server-rendering tests with the web artifact's test-specific JSX configuration rather than its default Vite-oriented configuration.

**Why:** Vite handles JSX in the running app, but the default web TypeScript configuration preserves JSX. Direct TSX test execution can transform component JSX into references to an unimported `React`, causing `React is not defined` errors even when the app itself is healthy.

**How to apply:** Set `TSX_TSCONFIG_PATH=tsconfig.test.json` when executing web TSX tests from the web artifact directory. Do not diagnose these errors as component runtime failures until rerunning with that JSX override.