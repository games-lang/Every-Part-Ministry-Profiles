---
name: OpenAPI generated-name collisions
description: Naming constraint for the repository's Orval-generated React and Zod clients
---

When an OpenAPI operation uses a component schema whose name matches Orval's generated operation body or response name, the Zod package can export duplicate identifiers and fail library typechecking. Keep reusable component names distinct from operation-generated names, then regenerate both clients.

**Why:** The generator emits both operation validators and component TypeScript types, and the package re-exports both namespaces.

**How to apply:** For endpoints such as imports, use distinct component names (for example, an input/result component) while keeping the operationId expressive; run API codegen before wiring the generated hook.