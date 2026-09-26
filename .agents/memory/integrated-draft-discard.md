---
name: Integrated draft discard
description: The ownership and format boundaries when an anonymous adult draft is discarded.
---

Treat an explicit discard as a two-sided operation: revoke the token-authenticated unfinished attempt on the server before clearing both local draft backups. If server deletion fails, retain the browser copy and show a retryable error; never silently claim discard succeeded. A completed profile must not be deleted through draft discard.

**Why:** Clearing only the browser token leaves an orphaned server draft; clearing only the server token leaves a pre-start backup that restores on reload. An in-flight draft also pins its original integrated format, so the landing must refresh the church's current setting when that draft is discarded.

**How to apply:** Keep draft resume bound to its frozen snapshot. After confirmed discard, refresh church configuration before offering a new start, including when another page saved a classic/integrated toggle while the draft was open.