import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import {
  appointments as seedAppointments,
  clients as seedClients,
  services as seedServices,
  staff as seedStaff,
  tenants as seedTenants,
} from "../seed-data";

/**
 * Seeds Neon with the Lumen demo tenant. Run after `npm run db:push`:
 *
 *   USE_DATABASE=true DATABASE_URL=... npm run db:seed
 *
 * It maps the string IDs in seed-data into the tenant's real UUIDs so foreign
 * keys line up. Idempotency is not handled — run against an empty database.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed.");
  }
  const db = drizzle(neon(process.env.DATABASE_URL), { schema });

  for (const t of seedTenants) {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        slug: t.slug,
        name: t.name,
        tagline: t.tagline,
        logoMark: t.logoMark,
        logoUrl: t.logoUrl,
        brandColor: t.brandColor,
        customDomain: t.customDomain,
        address: t.address,
        timezone: t.timezone,
        openTime: t.openTime,
        closeTime: t.closeTime,
        cancellationWindowHours: t.cancellationWindowHours,
      })
      .returning();

    const serviceIdMap = new Map<string, string>();
    for (const s of seedServices.filter((x) => x.tenantId === t.id)) {
      const [row] = await db
        .insert(schema.services)
        .values({
          tenantId: tenant.id,
          name: s.name,
          category: s.category,
          durationMin: s.durationMin,
          priceCents: s.priceCents,
        })
        .returning();
      serviceIdMap.set(s.id, row.id);
    }

    const staffIdMap = new Map<string, string>();
    for (const s of seedStaff.filter((x) => x.tenantId === t.id)) {
      const [row] = await db
        .insert(schema.staff)
        .values({
          tenantId: tenant.id,
          name: s.name,
          shortName: s.shortName,
          role: s.role,
          isOwner: s.isOwner ? 1 : 0,
          avatarColor: s.avatarColor,
          workdays: JSON.stringify(s.workdays),
          shiftStart: s.shiftStart,
          shiftEnd: s.shiftEnd,
          serviceIds: JSON.stringify(s.serviceIds.map((id) => serviceIdMap.get(id) ?? id)),
        })
        .returning();
      staffIdMap.set(s.id, row.id);
    }

    const clientIdMap = new Map<string, string>();
    for (const c of seedClients.filter((x) => x.tenantId === t.id)) {
      const [row] = await db
        .insert(schema.clients)
        .values({
          tenantId: tenant.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          totalSpendCents: c.totalSpendCents,
          visits: c.visits,
          noShows: c.noShows,
          notes: c.notes,
        })
        .returning();
      clientIdMap.set(c.id, row.id);
    }

    for (const a of seedAppointments.filter((x) => x.tenantId === t.id)) {
      await db.insert(schema.appointments).values({
        tenantId: tenant.id,
        clientId: clientIdMap.get(a.clientId)!,
        staffId: staffIdMap.get(a.staffId)!,
        serviceId: serviceIdMap.get(a.serviceId)!,
        date: a.date,
        startTime: a.startTime,
        durationMin: a.durationMin,
        priceCents: a.priceCents,
        status: a.status,
        payment: a.payment,
        notes: a.notes,
      });
    }

    console.log(`Seeded tenant "${t.name}" (${tenant.id}).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
