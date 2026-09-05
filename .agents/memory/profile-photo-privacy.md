---
name: Profile photo privacy
description: Privacy and storage boundaries for optional adult and youth profile pictures.
---

Profile pictures are optional private profile data. Store only an opaque private object-storage path, validate the church-scoped path and uploaded bytes before saving, and serve the image only to an authenticated leader from the profile’s church.

**Why:** Youth and adult profile submissions may be public, but uploaded pictures must not become public object URLs or leak through result and journey links.

**How to apply:** Keep photo upload paths out of public responses and browser drafts. Any new profile-photo display must use the authenticated same-church image endpoint; public youth result payloads must continue to omit photo data.