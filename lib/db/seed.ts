import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
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

/**
 * Seeds Neon with the Lumen demo tenant. Run after `npm run db:push`:
 *
 *   npm run db:seed
 *
 * Ids from seed-data are preserved verbatim (the schema uses text PKs), so DB
 * mode matches the in-memory store exactly. Safe to re-run: it truncates the
 * business tables first.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed.");
  }
  const db = drizzle(neon(process.env.DATABASE_URL), { schema });

  // Clear existing data (children first, then parents) so re-seeding is idempotent.
  await db.execute(
    sql`TRUNCATE TABLE appointments, services, staff, clients, tenants RESTART IDENTITY CASCADE`,
  );

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
    }

    console.log(
      `Seeded "${t.name}": ${tServices.length} services, ${tStaff.length} staff, ${tClients.length} clients, ${tAppts.length} appointments.`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
