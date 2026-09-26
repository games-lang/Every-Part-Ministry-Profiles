---
name: Onboarding validation compatibility
description: An installed form-resolver combination may throw rather than present inline Zod validation errors.
---

First-time church setup must translate invalid Zod results into visible field-level errors instead of assuming React Hook Form's resolver will do so.

**Why:** In a real browser, an invalid onboarding entry caused the installed resolver path to throw Zod issues into the Vite error overlay. Typechecking and building did not reveal the failure.

**How to apply:** Keep explicit safe-parse-to-field-error handling in this flow, or verify any replacement resolver with invalid inputs in the running browser before changing it. Check both required and malformed-email cases.