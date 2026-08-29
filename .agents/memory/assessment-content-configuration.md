---
name: Assessment content configuration
description: Compatibility rules for church-specific assessment sections and saved ministry profiles.
---

Church assessment-content choices affect new assessments only. Every submitted profile keeps the server-resolved configuration snapshot that governed its questions, and historical profile pages render from that snapshot. Profiles created before snapshots existed use the all-enabled legacy behavior. Generic passion and ministry-interest options are protected defaults; pastors may append church-specific options but cannot remove the generic set.

**Why:** Pastors may change future assessment content without erasing, reinterpreting, or unexpectedly hiding information members already submitted.

**How to apply:** Resolve configuration on the server, union protected generic options with validated church additions, never trust a client-provided snapshot, omit disabled inputs from new submissions, and use the stored snapshot whenever displaying an existing profile.