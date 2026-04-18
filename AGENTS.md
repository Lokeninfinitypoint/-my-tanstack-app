# AGENTS.md

Durable context for Claude / other coding agents working on this repo.

## Scaffold command (for reference)

This repo was bootstrapped on the platform's SaaS starter template, which already
matches the TanStack CLI `saas` preset. The equivalent TanStack CLI command is:

```bash
npx @tanstack/cli@latest create my-tanstack-app \
  --agent \
  --deployment cloudflare \
  --add-ons neon,form,sentry,shadcn,tanstack-query,better-auth,drizzle
```

If you need to regenerate a clean scaffold to diff against, run that command in
a **scratch** directory (not here). Merge any new files manually – do not wipe
this repo.

### Follow-up TanStack Intent commands

```bash
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

Use installed Intent skills before making architectural changes.

## Package manager & toolchain

- **Package manager:** yarn (`packageManager: yarn@1.22.22`). Use `yarn`, not `pnpm`
  or `npm`, for installing and adding dependencies.
- **Toolchain:** Biome (`biome.json`). Use `yarn check` (lint + format) and
  `yarn typecheck` before committing.
- **TypeScript:** strict mode on; module imports are aliased with `#/*` → `./src/*`.

## Stack

- **Runtime:** TanStack Start on Cloudflare Workers (via `@cloudflare/vite-plugin`,
  `wrangler.jsonc`).
- **Routing:** TanStack Router (file-based, `src/routes/`).
- **Data:** TanStack Query with SSR integration (`setupRouterSsrQueryIntegration`).
- **DB:** Neon (serverless Postgres) via `@neondatabase/serverless` + Drizzle
  (`src/db/schema.ts`, `drizzle.config.ts`).
- **Auth:** Better Auth (`src/lib/auth.ts`, `src/routes/api/auth/$.ts`).
- **Forms:** TanStack Form + Zod.
- **Tables:** AG Grid Community (Customers grid) + TanStack Virtual (invoices list)
  + TanStack Table (available for future views).
- **State:** TanStack Store (`src/lib/stores/dashboard-store.ts`).
- **Charts:** Recharts, fed by loaders/server functions so data is charts-ready.
- **Error monitoring:** Sentry via `@sentry/tanstackstart-react`; server spans via
  `Sentry.startSpan` in `src/server/*`.
- **UI:** Tailwind v4 + shadcn base tokens (`components.json`).

## Dashboard routes

- `/dashboard` – layout (`src/routes/dashboard/route.tsx`)
  - `/dashboard` (index) – KPIs + MRR and plan charts
  - `/dashboard/customers` – AG Grid table with quick filter, plan filter, CSV export
  - `/dashboard/customers/new` – TanStack Form → Drizzle insert
  - `/dashboard/billing` – virtualized invoices list (Stripe-ready shape)
  - `/dashboard/search` – SerpAPI-backed web search
  - `/dashboard/ai` – OpenRouter chat console
  - `/dashboard/settings` – TanStack Store preferences

A command palette (`Cmd/Ctrl+K`) and `g o` / `g c` / `g b` / `g s` / `g a` chord
hotkeys are wired globally in `src/routes/__root.tsx` via
`src/components/dashboard/CommandPalette.tsx` and `src/lib/hotkeys.ts`.

## Environment variables

Copy `.env.example` → `.env.local` and fill in:

| Var                        | Required | Purpose                                               |
| -------------------------- | -------- | ----------------------------------------------------- |
| `DATABASE_URL`             | yes      | Neon Postgres (auto-provisioned by vite-plugin-neon) |
| `DATABASE_URL_POOLER`      | yes      | Neon pooled connection for edge                       |
| `BETTER_AUTH_SECRET`       | yes      | Better Auth signing key (`yarn dlx @better-auth/cli secret`) |
| `BETTER_AUTH_URL`          | yes      | Public URL (default http://localhost:3000)            |
| `VITE_SENTRY_DSN`          | no       | Sentry DSN (client + server)                          |
| `VITE_SENTRY_ORG`          | no       | Sentry org slug                                       |
| `VITE_SENTRY_PROJECT`      | no       | Sentry project slug                                   |
| `SENTRY_AUTH_TOKEN`        | no       | Sentry auth token for sourcemap upload                |
| `SERPAPI_API_KEY`          | no       | Enables `/dashboard/search`                           |
| `SERPAPI_ENGINE`           | no       | Override engine (default `google`)                    |
| `OPENROUTER_API_KEY`       | no       | Enables `/dashboard/ai`                               |
| `OPENROUTER_MODEL`         | no       | Default model (default `anthropic/claude-3.5-sonnet`) |
| `APP_URL`                  | no       | Public URL sent to OpenRouter as `HTTP-Referer`       |

Cloudflare deploys: mirror these via `wrangler secret put <NAME>` (or add them to
`wrangler.jsonc` under `vars` for non-secrets).

## Partner integrations – what is and is not wired

### Wired in code

- **Neon** – DB client (`src/db/index.ts`) + seed script (`db/init.sql`).
- **Drizzle** – schema + migrations (`src/db/schema.ts`, `drizzle/`).
- **Sentry** – init (`instrument.server.mjs`, `src/router.tsx`) + server spans.
- **Cloudflare** – `@cloudflare/vite-plugin`, `wrangler.jsonc`, `yarn deploy`.
- **AG Grid Community** – `src/components/dashboard/CustomersGrid.tsx`. Install
  `ag-grid-enterprise` + set a license key only if Enterprise is explicitly
  requested.
- **SerpAPI** – server-only (`src/server/serpapi.ts`). Engine fixed per env.
  Response is normalized to `SerpResult[]`.
- **OpenRouter** – server-only (`src/server/openrouter.ts`) via the official
  `openai` SDK pointed at `https://openrouter.ai/api/v1`. Key never reaches the
  browser.
- **Better Auth** – email/password enabled in `src/lib/auth.ts`.
- **CodeRabbit** – repo-level config at `.coderabbit.yaml`. **Install the
  CodeRabbit GitHub App** at https://github.com/apps/coderabbitai and enable it
  for this repo to activate review. No runtime SDK is shipped.

### Setup notes / TODOs (no runtime code yet)

- **WorkOS** – add `@workos-inc/node` and replace the Better Auth handler in
  `src/routes/api/auth/$.ts` if SSO/SAML is required. Keep the client ID and API
  key server-side (`WORKOS_API_KEY`, `WORKOS_CLIENT_ID`).
- **Clerk** – alternative auth. Add `@clerk/tanstack-start` and swap the root
  provider if going that route. Don't run Better Auth + Clerk simultaneously.
- **Electric** – use the official Electric starter path
  (https://electric-sql.com/docs/quickstart). Running Electric needs a Postgres
  with logical replication and the Electric sync service; don't hand-roll sync
  plumbing in this repo.
- **PowerSync** – install `@powersync/web` + `@journeyapps/wa-sqlite` and, if
  using TanStack collections, `@tanstack/powersync-db-collection`. A backend
  connector + auth token endpoint must exist before wiring the client.
- **Prisma** – only add if migrating off Drizzle. Running both ORMs against the
  same schema is not supported in this repo.
- **Railway** – alternate deployment target. Add `railway.json` + a Dockerfile
  and run `railway up`. The default deploy path here is Cloudflare Workers.

## Architectural decisions

1. **Server functions over REST.** Data mutations and third-party calls go
   through `createServerFn` modules in `src/server/`. The client never holds
   `SERPAPI_API_KEY` or `OPENROUTER_API_KEY`.
2. **Dashboard nested routes** live under `src/routes/dashboard/` with a single
   layout (`route.tsx`). Add new sections as sibling files.
3. **Data-table strategy:** AG Grid for rich interactive grids, TanStack Virtual
   for tall lists (invoices), TanStack Table kept in deps for bespoke headless
   tables when needed.
4. **Charts:** Recharts reads a time-series normalized by server functions so UI
   stays chart-ready regardless of the underlying data source.
5. **Billing:** schema has `subscriptions.providerSubscriptionId` and
   `invoices.status` matching Stripe semantics; wire Stripe webhooks under
   `src/routes/api/billing/` when a provider is picked.

## Known gotchas

- `src/routeTree.gen.ts` is generated – never edit by hand. Ignored by Biome.
- `ag-grid-react` ships CSS imports; keep them in the component file (not in
  `styles.css`) so SSR treeshakes properly.
- SerpAPI/OpenRouter handlers use dynamic `import()` so the provider SDKs never
  end up in the client bundle.
- Cloudflare Workers: `@neondatabase/serverless` is used so the DB call path
  works on the edge. Drizzle-kit CLI still needs Node locally.

## Next steps

1. Run `yarn install`, then `yarn db:push` against a Neon branch to apply the
   new schema, or run `db/init.sql` via `psql`.
2. Wire real auth-guarded routes: add `beforeLoad` to `src/routes/dashboard/route.tsx`
   that checks Better Auth session and redirects to `/demo/better-auth` when
   unauthenticated.
3. Add a Stripe (or LemonSqueezy) webhook handler under
   `src/routes/api/billing/webhook.ts` to populate `invoices` and
   `subscriptions` for real.
4. Replace the synthetic `trend` in `dashboardMetrics` with an aggregation over
   `usage_events`.
5. Install the CodeRabbit GitHub App on the repo so `.coderabbit.yaml` takes
   effect.
