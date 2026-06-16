# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A multi-tenant, white-label SaaS for small service businesses — the
**appointments vertical** (first of four planned pillars: appointments →
inventory → financial → website). One codebase serves many tenants; each gets a
branded operator app and a public booking site. See `README.md` for product
context and Neon wiring.

Stack: **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Drizzle ORM + Neon Postgres**. Deploys to Vercel.

## Commands

- `npm run dev` — dev server at :3000
- `npm run build` — production build; **this is the typecheck + lint gate** (run
  it to verify changes). `npx tsc --noEmit` for a faster types-only check.
- `npm run lint` — ESLint
- `npm run db:generate | db:push | db:seed` — Drizzle migrations / seed (Neon)

There is no separate test suite yet. To exercise domain logic ad hoc, use
`npx tsx -e '...'` importing from `lib/` (e.g. `lib/availability.ts`,
`lib/store.ts`).

## The white-label model — read this first

The **single** theming lever is the `--brand` CSS custom property. Every tinted
element (primary buttons, the live now-line, active nav, selected slots) reads
from it via Tailwind utilities (`bg-brand`, `text-brand`, `border-brand`,
`bg-brand-tint`, `ring-brand`) or `color-mix(in oklch, var(--brand) …)`.

- `--brand` is injected per surface as an inline style on the wrapping element:
  `app/operator/layout.tsx`, `app/book/[slug]/layout.tsx`, and `app/page.tsx`.
- **Never hard-code a tenant accent color in a component.** Distinctiveness must
  live in layout/type/spacing so any brand color drops in cleanly. Status colors
  (confirmed/pending/etc. in `STATUS_STYLES`) are deliberately neutral hues and
  are the *only* fixed colors.
- The branding settings page (`components/operator/BrandingSettings.tsx`)
  overrides `--brand` locally so its live preview reflects the in-progress color
  before saving.

Design tokens live in `app/globals.css` under `@theme` (Tailwind v4 — no
`tailwind.config`). Fonts: Manrope (sans) + Space Grotesk (display), loaded via
`next/font` in `app/layout.tsx` and exposed as `--font-sans` / `--font-display`.
Tabular figures use the `.tnum` class for any numeric/time data.

## Data flow

All UI reads/writes go through **`lib/store.ts`** — the single data-access seam.
Today it's an in-memory store seeded from `lib/seed-data.ts` (the "Lumen Studio"
tenant), so the app runs with no database. Its function signatures are the
contract: when `USE_DATABASE=true`, reimplement those functions as Drizzle
queries against `lib/db/` — **components and actions should not change.**

- `lib/types.ts` — domain model (Tenant, Staff, Service, Client, Appointment).
  Every entity carries `tenantId`.
- `lib/store.ts` — data access (get/update tenant, staff, services, clients,
  appointments; `createBooking`, `setAppointmentStatus`). Mutations persist only
  for the server process lifetime (in-memory).
- `lib/availability.ts` — the scheduling engine: computes open start-times from
  staff workdays/shifts + existing bookings + service duration + tenant hours.
  **This is the seam for the real engine** — when on Neon, prevent
  double-booking with a DB-level exclusion constraint, not just this check.
- `lib/db/schema.ts` — Drizzle/Neon schema (shared-schema multi-tenancy; RLS
  policy sketch in comments). `lib/db/index.ts` gates the connection on
  `USE_DATABASE`. `lib/db/seed.ts` loads the demo tenant into Neon.
- `app/actions.ts` — server actions: `changeAppointmentStatus`, `submitBooking`,
  `fetchSlots`, `rescheduleAppt` (operator), `rescheduleByRef` / `cancelByRef`
  (public, by booking ref), `saveBranding`. These call the store and
  `revalidatePath`.

Booking references (`bookingRef` in `lib/store.ts`) are deterministic —
`<SLUG3>-<4 digits of the appt id>`, e.g. `LUM-0020`. The public Manage-booking
flow resolves an appointment from its ref (`getAppointmentByRef`,
case-insensitive).

Important quirk: in seed data **`tenantId` equals the tenant `slug`** ("lumen").
The store is keyed accordingly. Real UUIDs arrive when Neon is wired (the seed
script maps string IDs → UUIDs).

## Routing

Path-based today; host-based routing is a documented pass-through in
`middleware.ts` (subdomain / custom domain → `/book/[slug]` rewrite) for when
custom domains go live.

- `app/operator/*` — internal app. `layout.tsx` resolves the tenant (currently
  the default; replace with the auth session's tenant) and sets `--brand`. Pages:
  `dashboard`, `calendar`, `clients`, `services`, `staff`, `settings`.
- `app/operator/settings/*` — a nested shell: `settings/layout.tsx` renders the
  Topbar + left subnav (highlighted via `usePathname`) and each tab page renders
  only its form. Tabs: `branding`, `business`, `hours`, `notifications`,
  `payments`; `settings/` redirects to `branding`. Per-tenant settings live in
  the store (`getBusinessHours`/`setBusinessHours`, `getNotificationPrefs`/…,
  `getPaymentSettings`/…) seeded from `lib/seed-data.ts` via `structuredClone`.
- Operator CRUD: services (`ServicesView` + `ServiceEditor`), staff (`StaffView`
  + `StaffEditor`), clients (`ClientsView` + `ClientEditor`) use modal editors
  (pattern: `NewAppointmentModal`) wired to `create*/update*/delete*` actions.
  Global Topbar search is `SearchBox` (debounced `searchAction`, grouped dropdown).
- `app/book/[slug]/*` — public booking site for one tenant, resolved from the
  slug; 404s on unknown slugs. `page.tsx` is the booking flow; `manage/page.tsx`
  is the no-account Manage-booking screen (`?ref=<bookingRef>`; shows a lookup
  form when the ref is missing/invalid).

## Component conventions

- Server components fetch from the store and pass plain data down; mark
  interactive pieces `"use client"` (calendar + slide-over, clients selector,
  booking flow, manage-booking, branding settings, new-appointment modal).
- The calendar lives in `components/operator/Calendar.tsx` (orchestrator) with a
  `DayGrid` (column-per-staff) and `WeekGrid` (column-per-day) plus the extracted
  `AppointmentPanel.tsx` slide-over. It is **URL-driven**: `?date=<iso>` (default
  `DEMO_DATE`), `?view=day|week`, `?appt=<id>` (open slide-over), `?new=1`
  (new-appointment modal). Nav/Today/Day-Week toggle just rewrite these params.
  Grid math: `HOUR_PX = 56`, day window 09:00–18:00.
- Date math on `YYYY-MM-DD` strings uses the **UTC-based helpers in `lib/utils.ts`**
  (`addDays`, `weekDates`, `weekdayOf`, `formatDateLabel`, …). Don't parse date
  strings with `new Date(iso + "T00:00:00")` (local time) — it drifts by a day in
  some timezones. Use the helpers, which pin to UTC.
- The demo clock is centralized in `lib/seed-data.ts`: `DEMO_DATE` (2026-06-15)
  and `DEMO_NOW_MINUTES` (11:24). The now-line only renders on `DEMO_DATE`.
  Replace these with real time when going live.
- Empty/loading/error UI: `components/ui/States.tsx` (`EmptyState`, `ErrorState`,
  `SkeletonList`, `SlotSkeleton`). Used by the calendar (clear day), clients
  (no clients / no search matches), and all three slot pickers while loading.
- The `.ics` "Add to calendar" download is built by `buildIcs` in `lib/utils.ts`.
- Styling is Tailwind utilities; exact pixel values from the design are kept as
  arbitrary values (e.g. `text-[13.5px]`, `rounded-[13px]`) to stay faithful.

## Design source

The original Claude Design files are in `Calendar app design scope/` (excluded
from the TS build). They are the source of truth for visual details — the
high-fi `Lumen Studio.dc.html` for the operator app and `Wireframe Map.dc.html`
for the full screen inventory including the booking flow and empty/loading/error
states. Consult them before changing visual structure.
