import { sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import {
  appointments as seedAppointments,
  businessHours as seedBusinessHours,
  clients as seedClients,
  notificationPrefs as seedNotificationPrefs,
  paymentSettings as seedPaymentSettings,
  services as seedServices,
  staff as seedStaff,
  tenants as seedTenants,
} from "../seed-data";

type Db = NeonHttpDatabase<typeof schema>;

export interface SeedSummary {
  tenants: number;
  services: number;
  staff: number;
  clients: number;
  appointments: number;
}

/**
 * Create the schema if it doesn't exist. Idempotent — uses IF NOT EXISTS so it
 * is safe to call against a fresh OR already-migrated database. Mirrors
 * lib/db/schema.ts; keep in sync if the schema changes (the generated
 * migration in drizzle/ is the source of truth).
 */
export async function ensureSchema(db: Db): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "appointment_status" AS ENUM('confirmed','pending','completed','noshow','cancelled');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "payment_status" AS ENUM('Paid','Unpaid','Refunded');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenants" (
      "id" text PRIMARY KEY NOT NULL,
      "slug" varchar(63) NOT NULL UNIQUE,
      "name" text NOT NULL,
      "tagline" text DEFAULT '' NOT NULL,
      "logo_mark" varchar(4) DEFAULT '•' NOT NULL,
      "logo_url" text,
      "brand_color" varchar(9) DEFAULT '#6d4a63' NOT NULL,
      "custom_domain" text,
      "address" text DEFAULT '' NOT NULL,
      "phone" text DEFAULT '' NOT NULL,
      "email" text DEFAULT '' NOT NULL,
      "timezone" text DEFAULT 'America/Los_Angeles' NOT NULL,
      "open_time" varchar(5) DEFAULT '09:00' NOT NULL,
      "close_time" varchar(5) DEFAULT '18:00' NOT NULL,
      "cancellation_window_hours" integer DEFAULT 24 NOT NULL,
      "business_hours" jsonb,
      "notification_prefs" jsonb,
      "payment_settings" jsonb,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "services" (
      "id" text PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "category" text NOT NULL,
      "duration_min" integer NOT NULL,
      "price_cents" integer NOT NULL
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "staff" (
      "id" text PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "short_name" text NOT NULL,
      "role" text NOT NULL,
      "is_owner" integer DEFAULT 0 NOT NULL,
      "avatar_color" varchar(9) DEFAULT '#ece9ef' NOT NULL,
      "workdays" text DEFAULT '[]' NOT NULL,
      "shift_start" varchar(5) DEFAULT '09:00' NOT NULL,
      "shift_end" varchar(5) DEFAULT '17:00' NOT NULL,
      "service_ids" text DEFAULT '[]' NOT NULL
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "clients" (
      "id" text PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "phone" text DEFAULT '' NOT NULL,
      "email" text DEFAULT '' NOT NULL,
      "total_spend_cents" integer DEFAULT 0 NOT NULL,
      "visits" integer DEFAULT 0 NOT NULL,
      "no_shows" integer DEFAULT 0 NOT NULL,
      "notes" text DEFAULT '' NOT NULL
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "appointments" (
      "id" text PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
      "client_id" text NOT NULL REFERENCES "clients"("id") ON DELETE cascade,
      "staff_id" text NOT NULL REFERENCES "staff"("id") ON DELETE restrict,
      "service_id" text NOT NULL REFERENCES "services"("id") ON DELETE restrict,
      "date" varchar(10) NOT NULL,
      "start_time" varchar(5) NOT NULL,
      "duration_min" integer NOT NULL,
      "price_cents" integer NOT NULL,
      "status" "appointment_status" DEFAULT 'pending' NOT NULL,
      "payment" "payment_status" DEFAULT 'Unpaid' NOT NULL,
      "notes" text DEFAULT '' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);
}

/**
 * Load the demo tenant(s). Truncates the business tables first, so it is safe
 * to re-run. Ids from seed-data are preserved verbatim (text PKs).
 */
export async function runSeed(db: Db): Promise<SeedSummary> {
  await db.execute(
    sql`TRUNCATE TABLE appointments, services, staff, clients, tenants RESTART IDENTITY CASCADE`,
  );

  const summary: SeedSummary = { tenants: 0, services: 0, staff: 0, clients: 0, appointments: 0 };

  for (const t of seedTenants) {
    await db.insert(schema.tenants).values({
      id: t.id,
      slug: t.slug,
      name: t.name,
      tagline: t.tagline,
      logoMark: t.logoMark,
      logoUrl: t.logoUrl,
      brandColor: t.brandColor,
      customDomain: t.customDomain,
      address: t.address,
      phone: t.phone,
      email: t.email,
      timezone: t.timezone,
      openTime: t.openTime,
      closeTime: t.closeTime,
      cancellationWindowHours: t.cancellationWindowHours,
      businessHours: seedBusinessHours[t.id] ?? null,
      notificationPrefs: seedNotificationPrefs[t.id] ?? null,
      paymentSettings: seedPaymentSettings[t.id] ?? null,
    });
    summary.tenants++;

    const tServices = seedServices.filter((x) => x.tenantId === t.id);
    if (tServices.length) {
      await db.insert(schema.services).values(
        tServices.map((s) => ({
          id: s.id,
          tenantId: s.tenantId,
          name: s.name,
          category: s.category,
          durationMin: s.durationMin,
          priceCents: s.priceCents,
        })),
      );
      summary.services += tServices.length;
    }

    const tStaff = seedStaff.filter((x) => x.tenantId === t.id);
    if (tStaff.length) {
      await db.insert(schema.staff).values(
        tStaff.map((s) => ({
          id: s.id,
          tenantId: s.tenantId,
          name: s.name,
          shortName: s.shortName,
          role: s.role,
          isOwner: s.isOwner ? 1 : 0,
          avatarColor: s.avatarColor,
          workdays: JSON.stringify(s.workdays),
          shiftStart: s.shiftStart,
          shiftEnd: s.shiftEnd,
          serviceIds: JSON.stringify(s.serviceIds),
        })),
      );
      summary.staff += tStaff.length;
    }

    const tClients = seedClients.filter((x) => x.tenantId === t.id);
    if (tClients.length) {
      await db.insert(schema.clients).values(
        tClients.map((c) => ({
          id: c.id,
          tenantId: c.tenantId,
          name: c.name,
          phone: c.phone,
          email: c.email,
          totalSpendCents: c.totalSpendCents,
          visits: c.visits,
          noShows: c.noShows,
          notes: c.notes,
        })),
      );
      summary.clients += tClients.length;
    }

    const tAppts = seedAppointments.filter((x) => x.tenantId === t.id);
    if (tAppts.length) {
      await db.insert(schema.appointments).values(
        tAppts.map((a) => ({
          id: a.id,
          tenantId: a.tenantId,
          clientId: a.clientId,
          staffId: a.staffId,
          serviceId: a.serviceId,
          date: a.date,
          startTime: a.startTime,
          durationMin: a.durationMin,
          priceCents: a.priceCents,
          status: a.status,
          payment: a.payment,
          notes: a.notes,
        })),
      );
      summary.appointments += tAppts.length;
    }
  }

  return summary;
}
