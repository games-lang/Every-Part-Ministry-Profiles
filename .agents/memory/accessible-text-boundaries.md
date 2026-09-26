---
name: Accessible text boundaries
description: Dynamic JSX text can look spaced visually while its accessibility name loses word boundaries.
---

When a phrase mixes a dynamic value with surrounding words, produce the phrase as one string expression rather than relying on whitespace between JSX text and expression nodes.

**Why:** The browser accessibility tree exposed phrases such as “26spiritual gifts included” and “40–60min estimated” even though the DOM and visible text appeared correctly spaced. Visual inspection alone missed the failure.

**How to apply:** For dynamic counts, names, ranges, and labels, check the computed accessibility text after rendering, including text inside popovers and portal content. Prefer a complete template string for one semantic phrase; do not alter unrelated form behavior or saved values.