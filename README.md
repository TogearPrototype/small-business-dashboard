# Lumen — White-label appointment scheduling

A multi-tenant SaaS for small service businesses (salons, clinics, spas). One
codebase serves many independent businesses, each with its own brand and public
booking site. This is the **appointments vertical** — the first of four planned
pillars (appointments → inventory → financial → integrated website).

Two surfaces, one product family:

- **Operator app** (`/operator`) — data-dense internal app: dashboard, calendar
  with appointment slide-over, clients, services, staff, and white-label
  settings.
- **Public booking site** (`/book/[slug]`) — mobile-first, branded-per-tenant
  flow: service → staff → date/time → details → review → confirmation.

The single white-label lever is the `--brand` CSS token. Layout, type, spacing,
and the calendar system carry the identity; color is swappable per tenant so
the same code recolors for every reseller's client.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

The app runs immediately on **seeded in-memory demo data** (the "Lumen Studio"
tenant) — no database required. Open `/` for a landing page linking both
surfaces, or jump to `/operator/dashboard` and `/book/lumen`.

> The demo revolves around **Monday, June 15 2026** with a now-line at 11:24,
> matching the design.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also typechecks + lints) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Drizzle SQL migrations from the schema |
| `npm run db:push` | Push schema to Neon |
| `npm run db:seed` | Seed Neon with the demo tenant |

## Wiring Neon (Postgres + Auth)

The app ships ready for Neon but defaults to the in-memory store so it runs with
zero setup. To switch to a real database:

1. Create a project in the [Neon console](https://console.neon.tech) and copy
   the pooled connection string.
2. `cp .env.example .env` and set `DATABASE_URL`, then `USE_DATABASE=true`.
3. `npm run db:push` to create tables, then `npm run db:seed` to load the demo
   tenant.
4. Implement the Drizzle-backed reads in `lib/store.ts` (the function
   signatures are the contract; `lib/db/index.ts` exposes the `db` handle when
   `USE_DATABASE=true`).

Multi-tenancy is **shared-schema with row-level isolation**: every business
table carries `tenant_id`. Enable Postgres Row-Level Security in production so
no query can cross tenants (see `lib/db/schema.ts` for the policy sketch).

For auth, use **Neon Auth** (Stack Auth) — provision it in the Neon console and
paste the keys into `.env`. The operator layout currently resolves the default
tenant; swap that for the authenticated session's tenant.

## Deploy (Vercel)

Push to GitHub and import in Vercel. Set the env vars from `.env.example` in the
Vercel project settings. Custom domains per tenant are handled in `middleware.ts`
(currently a documented pass-through) — pair it with Vercel's domains API or
Cloudflare for SaaS for automatic per-tenant SSL.

## Architecture

See [CLAUDE.md](./CLAUDE.md) for the code map and conventions.
