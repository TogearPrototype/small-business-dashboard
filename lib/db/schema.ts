import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema for Neon Postgres — multi-tenant, shared-schema with a
 * tenant_id on every business table. In production, enable Row-Level Security
 * so no query can cross tenants:
 *
 *   ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY tenant_isolation ON appointments
 *     USING (tenant_id = current_setting('app.tenant_id')::uuid);
 *
 * and set `app.tenant_id` per request from the authenticated session.
 *
 * This schema is ready to migrate (`npm run db:generate && npm run db:push`)
 * but the app runs on the in-memory store until USE_DATABASE=true.
 */

export const appointmentStatus = pgEnum("appointment_status", [
  "confirmed",
  "pending",
  "completed",
  "noshow",
  "cancelled",
]);

export const paymentStatus = pgEnum("payment_status", ["Paid", "Unpaid", "Refunded"]);

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 63 }).notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  logoMark: varchar("logo_mark", { length: 4 }).notNull().default("•"),
  logoUrl: text("logo_url"),
  brandColor: varchar("brand_color", { length: 9 }).notNull().default("#6d4a63"),
  customDomain: text("custom_domain"),
  address: text("address").notNull().default(""),
  timezone: text("timezone").notNull().default("America/Los_Angeles"),
  openTime: varchar("open_time", { length: 5 }).notNull().default("09:00"),
  closeTime: varchar("close_time", { length: 5 }).notNull().default("18:00"),
  cancellationWindowHours: integer("cancellation_window_hours").notNull().default(24),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  role: text("role").notNull(),
  isOwner: integer("is_owner").notNull().default(0),
  avatarColor: varchar("avatar_color", { length: 9 }).notNull().default("#ece9ef"),
  // JSON-encoded arrays: workdays (number[]) and serviceIds (string[]).
  workdays: text("workdays").notNull().default("[]"),
  shiftStart: varchar("shift_start", { length: 5 }).notNull().default("09:00"),
  shiftEnd: varchar("shift_end", { length: 5 }).notNull().default("17:00"),
  serviceIds: text("service_ids").notNull().default("[]"),
});

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  durationMin: integer("duration_min").notNull(),
  priceCents: integer("price_cents").notNull(),
});

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  totalSpendCents: integer("total_spend_cents").notNull().default(0),
  visits: integer("visits").notNull().default(0),
  noShows: integer("no_shows").notNull().default(0),
  notes: text("notes").notNull().default(""),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "restrict" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "restrict" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM
  durationMin: integer("duration_min").notNull(),
  priceCents: integer("price_cents").notNull(),
  status: appointmentStatus("status").notNull().default("pending"),
  payment: paymentStatus("payment").notNull().default("Unpaid"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
