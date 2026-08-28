# Every Part

A multi-tenant ministry discovery app that helps churches understand their people and connect them with meaningful places to serve.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/db/src/schema/` — church and Ministry Profile database models
- `artifacts/api-server/src/routes/` — tenant-aware API endpoints
- `artifacts/every-part/src/pages/` — landing, assessment, setup, dashboard, and profile pages
- `artifacts/every-part/src/index.css` — visual theme and print styles

## Architecture decisions

- Clerk authenticates church administrators; members can submit a profile without creating an account.
- Every pastor-facing query derives the church from the signed-in Clerk user and scopes records by church ID.
- Future APEST, gifts, personality, and spiritual-health results are stored as nullable structured sections until scoring is defined.
- The OpenAPI contract generates both browser hooks and server validation schemas.

## Product

Church leaders can create an account, complete church setup, share a unique Ministry Profile link, review submissions, filter the member directory, open detailed profiles, and print conversation-ready reports. Members complete a mobile multi-step assessment and immediately receive a Ministry Profile summary.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run API code generation after every change to `lib/api-spec/openapi.yaml`.
- Keep the public home page accessible to signed-out visitors; protected pastor routes redirect through Clerk.
- Do not query profiles without constraining them to the signed-in administrator's church.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
