import { and, eq, gte, lte } from "drizzle-orm";
import type {
  Appointment,
  AppointmentDetail,
  AppointmentStatus,
  BusinessHours,
  Client,
  NotificationPrefs,
  PaymentSettings,
  Service,
  Staff,
  Tenant,
  Weekday,
} from "../types";
import { addMinutes } from "../utils";
import { db as maybeDb, schema } from "./index";
import type { NewBookingInput } from "../store";

/**
 * Neon/Drizzle implementation of the data-access contract (see lib/store.ts).
 * Mirrors lib/memory-store.ts function-for-function, but async. Selected by the
 * store facade when USE_DATABASE === "true".
 *
 * Row ids are text and equal to the seed ids, so the data shape matches the
 * in-memory store exactly. App-created rows get generated ids (svc_/stf_/c_/a_
 * + a random suffix) since there is no shared counter across server instances.
 */

function db() {
  if (!maybeDb) throw new Error("Database not enabled (USE_DATABASE != true).");
  return maybeDb;
}

const { tenants, staff, services, clients, appointments } = schema;

// ---- row → domain mappers ----

function toTenant(r: typeof tenants.$inferSelect): Tenant {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    logoMark: r.logoMark,
    logoUrl: r.logoUrl,
    brandColor: r.brandColor,
    customDomain: r.customDomain,
    address: r.address,
    phone: r.phone,
    email: r.email,
    timezone: r.timezone,
    openTime: r.openTime,
    closeTime: r.closeTime,
    cancellationWindowHours: r.cancellationWindowHours,
  };
}

function toStaff(r: typeof staff.$inferSelect): Staff {
  return {
    id: r.id,
    tenantId: r.tenantId,
    name: r.name,
    shortName: r.shortName,
    role: r.role,
    isOwner: r.isOwner === 1,
    avatarColor: r.avatarColor,
    workdays: JSON.parse(r.workdays) as Weekday[],
    shiftStart: r.shiftStart,
    shiftEnd: r.shiftEnd,
    serviceIds: JSON.parse(r.serviceIds) as string[],
  };
}

function toService(r: typeof services.$inferSelect): Service {
  return {
    id: r.id,
    tenantId: r.tenantId,
    name: r.name,
    category: r.category,
    durationMin: r.durationMin,
    priceCents: r.priceCents,
  };
}

function toClient(r: typeof clients.$inferSelect): Client {
  return {
    id: r.id,
    tenantId: r.tenantId,
    name: r.name,
    phone: r.phone,
    email: r.email,
    totalSpendCents: r.totalSpendCents,
    visits: r.visits,
    noShows: r.noShows,
    notes: r.notes,
  };
}

function toAppointment(r: typeof appointments.$inferSelect): Appointment {
  return {
    id: r.id,
    tenantId: r.tenantId,
    clientId: r.clientId,
    staffId: r.staffId,
    serviceId: r.serviceId,
    date: r.date,
    startTime: r.startTime,
    durationMin: r.durationMin,
    priceCents: r.priceCents,
    status: r.status,
    payment: r.payment,
    notes: r.notes,
  };
}

/** Generate a readable, collision-resistant id (no shared counter in DB mode). */
function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

// ---- Tenants ----

export async function getTenant(slug: string): Promise<Tenant | undefined> {
  const rows = await db().select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return rows[0] ? toTenant(rows[0]) : undefined;
}

export async function getDefaultTenant(): Promise<Tenant> {
  const rows = await db().select().from(tenants).limit(1);
  if (!rows[0]) throw new Error("No tenant found — has the database been seeded?");
  return toTenant(rows[0]);
}

export async function updateTenantBranding(
  tenantId: string,
  patch: Partial<Pick<Tenant, "brandColor" | "logoUrl" | "customDomain" | "name" | "tagline">>,
): Promise<Tenant | undefined> {
  const rows = await db().update(tenants).set(patch).where(eq(tenants.id, tenantId)).returning();
  return rows[0] ? toTenant(rows[0]) : undefined;
}

export async function updateTenantProfile(
  tenantId: string,
  patch: Partial<Pick<Tenant, "name" | "tagline" | "address" | "phone" | "email" | "timezone">>,
): Promise<Tenant | undefined> {
  const rows = await db().update(tenants).set(patch).where(eq(tenants.id, tenantId)).returning();
  return rows[0] ? toTenant(rows[0]) : undefined;
}

// ---- Settings (JSONB columns on tenants) ----

const EMPTY_HOURS: BusinessHours = [];

export async function getBusinessHours(tenantId: string): Promise<BusinessHours> {
  const rows = await db().select({ v: tenants.businessHours }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return rows[0]?.v ?? EMPTY_HOURS;
}

export async function setBusinessHours(tenantId: string, hours: BusinessHours): Promise<BusinessHours> {
  await db().update(tenants).set({ businessHours: hours }).where(eq(tenants.id, tenantId));
  return hours;
}

export async function getNotificationPrefs(tenantId: string): Promise<NotificationPrefs> {
  const rows = await db().select({ v: tenants.notificationPrefs }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return rows[0]!.v as NotificationPrefs;
}

export async function setNotificationPrefs(
  tenantId: string,
  prefs: NotificationPrefs,
): Promise<NotificationPrefs> {
  await db().update(tenants).set({ notificationPrefs: prefs }).where(eq(tenants.id, tenantId));
  return prefs;
}

export async function getPaymentSettings(tenantId: string): Promise<PaymentSettings> {
  const rows = await db().select({ v: tenants.paymentSettings }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return rows[0]!.v as PaymentSettings;
}

export async function setPaymentSettings(
  tenantId: string,
  settings: PaymentSettings,
): Promise<PaymentSettings> {
  await db().update(tenants).set({ paymentSettings: settings }).where(eq(tenants.id, tenantId));
  return settings;
}

// ---- Staff / services / clients ----

export async function getStaff(tenantId: string): Promise<Staff[]> {
  const rows = await db().select().from(staff).where(eq(staff.tenantId, tenantId));
  return rows.map(toStaff);
}

export async function getStaffMember(tenantId: string, id: string): Promise<Staff | undefined> {
  const rows = await db()
    .select()
    .from(staff)
    .where(and(eq(staff.tenantId, tenantId), eq(staff.id, id)))
    .limit(1);
  return rows[0] ? toStaff(rows[0]) : undefined;
}

export async function getServices(tenantId: string): Promise<Service[]> {
  const rows = await db().select().from(services).where(eq(services.tenantId, tenantId));
  return rows.map(toService);
}

export async function getService(tenantId: string, id: string): Promise<Service | undefined> {
  const rows = await db()
    .select()
    .from(services)
    .where(and(eq(services.tenantId, tenantId), eq(services.id, id)))
    .limit(1);
  return rows[0] ? toService(rows[0]) : undefined;
}

export async function getClients(tenantId: string): Promise<Client[]> {
  const rows = await db().select().from(clients).where(eq(clients.tenantId, tenantId));
  return rows.map(toClient).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClient(tenantId: string, id: string): Promise<Client | undefined> {
  const rows = await db()
    .select()
    .from(clients)
    .where(and(eq(clients.tenantId, tenantId), eq(clients.id, id)))
    .limit(1);
  return rows[0] ? toClient(rows[0]) : undefined;
}

// ---- Appointments ----

/** Hydrate an appointment row with its related records, using already-fetched maps. */
function hydrateWith(
  a: Appointment,
  clientMap: Map<string, Client>,
  staffMap: Map<string, Staff>,
  serviceMap: Map<string, Service>,
): AppointmentDetail {
  return {
    ...a,
    client: clientMap.get(a.clientId)!,
    staff: staffMap.get(a.staffId)!,
    service: serviceMap.get(a.serviceId)!,
    endTime: addMinutes(a.startTime, a.durationMin),
  };
}

/** Fetch the lookup maps a tenant needs to hydrate appointments. */
async function lookupMaps(tenantId: string) {
  const [cl, st, sv] = await Promise.all([
    getClients(tenantId),
    getStaff(tenantId),
    getServices(tenantId),
  ]);
  return {
    clientMap: new Map(cl.map((c) => [c.id, c])),
    staffMap: new Map(st.map((s) => [s.id, s])),
    serviceMap: new Map(sv.map((s) => [s.id, s])),
  };
}

export async function getAppointments(tenantId: string, date: string): Promise<AppointmentDetail[]> {
  const [rows, maps] = await Promise.all([
    db()
      .select()
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.date, date))),
    lookupMaps(tenantId),
  ]);
  return rows
    .map(toAppointment)
    .map((a) => hydrateWith(a, maps.clientMap, maps.staffMap, maps.serviceMap))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function getAppointmentsInRange(
  tenantId: string,
  from: string,
  to: string,
): Promise<AppointmentDetail[]> {
  const [rows, maps] = await Promise.all([
    db()
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.date, from),
          lte(appointments.date, to),
        ),
      ),
    lookupMaps(tenantId),
  ]);
  return rows
    .map(toAppointment)
    .map((a) => hydrateWith(a, maps.clientMap, maps.staffMap, maps.serviceMap))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

export async function getAppointment(
  tenantId: string,
  id: string,
): Promise<AppointmentDetail | undefined> {
  const rows = await db()
    .select()
    .from(appointments)
    .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, id)))
    .limit(1);
  if (!rows[0]) return undefined;
  const maps = await lookupMaps(tenantId);
  return hydrateWith(toAppointment(rows[0]), maps.clientMap, maps.staffMap, maps.serviceMap);
}

export async function setAppointmentStatus(
  tenantId: string,
  id: string,
  status: AppointmentStatus,
): Promise<AppointmentDetail | undefined> {
  await db()
    .update(appointments)
    .set({ status })
    .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, id)));
  return getAppointment(tenantId, id);
}

export async function rescheduleAppointment(
  tenantId: string,
  id: string,
  date: string,
  startTime: string,
  staffId?: string,
): Promise<AppointmentDetail | undefined> {
  await db()
    .update(appointments)
    .set(staffId ? { date, startTime, staffId } : { date, startTime })
    .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, id)));
  return getAppointment(tenantId, id);
}

/** Deterministic booking ref — matches the in-memory store's format exactly. */
export async function bookingRef(tenantId: string, appointmentId: string): Promise<string> {
  const rows = await db().select({ slug: tenants.slug }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const prefix = (rows[0]?.slug ?? "bkg").slice(0, 3).toUpperCase();
  const digits = appointmentId.replace(/\D/g, "").padStart(4, "0").slice(-4);
  return `${prefix}-${digits}`;
}

export async function getAppointmentByRef(
  tenantId: string,
  ref: string,
): Promise<AppointmentDetail | undefined> {
  const target = ref.trim().toUpperCase();
  const rows = await db().select().from(appointments).where(eq(appointments.tenantId, tenantId));
  const slugRows = await db().select({ slug: tenants.slug }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const prefix = (slugRows[0]?.slug ?? "bkg").slice(0, 3).toUpperCase();
  const match = rows.find((a) => {
    const digits = a.id.replace(/\D/g, "").padStart(4, "0").slice(-4);
    return `${prefix}-${digits}` === target;
  });
  return match ? getAppointment(tenantId, match.id) : undefined;
}

export async function createBooking(input: NewBookingInput): Promise<AppointmentDetail> {
  const service = await getService(input.tenantId, input.serviceId);
  if (!service) throw new Error(`Unknown service ${input.serviceId}`);

  // Reuse an existing client matched by phone, else create one.
  const existing = await db()
    .select()
    .from(clients)
    .where(and(eq(clients.tenantId, input.tenantId), eq(clients.phone, input.clientPhone)))
    .limit(1);

  let clientId: string;
  if (existing[0]) {
    clientId = existing[0].id;
  } else {
    clientId = genId("c");
    await db().insert(clients).values({
      id: clientId,
      tenantId: input.tenantId,
      name: input.clientName,
      phone: input.clientPhone,
      email: input.clientEmail,
      totalSpendCents: 0,
      visits: 0,
      noShows: 0,
      notes: input.notes,
    });
  }

  const apptId = genId("a");
  await db().insert(appointments).values({
    id: apptId,
    tenantId: input.tenantId,
    clientId,
    staffId: input.staffId,
    serviceId: input.serviceId,
    date: input.date,
    startTime: input.startTime,
    durationMin: service.durationMin,
    priceCents: service.priceCents,
    status: "pending",
    payment: "Unpaid",
    notes: input.notes,
  });

  const detail = await getAppointment(input.tenantId, apptId);
  return detail!;
}

// ---- Service CRUD ----

export async function createService(
  tenantId: string,
  input: { name: string; category: string; durationMin: number; priceCents: number },
): Promise<Service> {
  const id = genId("svc");
  await db().insert(services).values({ id, tenantId, ...input });
  return { id, tenantId, ...input };
}

export async function updateService(
  tenantId: string,
  id: string,
  patch: Partial<Pick<Service, "name" | "category" | "durationMin" | "priceCents">>,
): Promise<Service | undefined> {
  const rows = await db()
    .update(services)
    .set(patch)
    .where(and(eq(services.tenantId, tenantId), eq(services.id, id)))
    .returning();
  return rows[0] ? toService(rows[0]) : undefined;
}

export async function deleteService(tenantId: string, id: string): Promise<boolean> {
  const rows = await db()
    .delete(services)
    .where(and(eq(services.tenantId, tenantId), eq(services.id, id)))
    .returning({ id: services.id });
  return rows.length > 0;
}

// ---- Staff CRUD ----

export async function createStaff(
  tenantId: string,
  input: {
    name: string;
    shortName: string;
    role: string;
    workdays: Weekday[];
    shiftStart: string;
    shiftEnd: string;
    serviceIds: string[];
    isOwner?: boolean;
  },
): Promise<Staff> {
  const id = genId("stf");
  await db().insert(staff).values({
    id,
    tenantId,
    name: input.name,
    shortName: input.shortName,
    role: input.role,
    isOwner: input.isOwner ? 1 : 0,
    avatarColor: "#ece9ef",
    workdays: JSON.stringify(input.workdays),
    shiftStart: input.shiftStart,
    shiftEnd: input.shiftEnd,
    serviceIds: JSON.stringify(input.serviceIds),
  });
  return {
    id,
    tenantId,
    name: input.name,
    shortName: input.shortName,
    role: input.role,
    isOwner: input.isOwner ?? false,
    avatarColor: "#ece9ef",
    workdays: input.workdays,
    shiftStart: input.shiftStart,
    shiftEnd: input.shiftEnd,
    serviceIds: input.serviceIds,
  };
}

export async function updateStaff(
  tenantId: string,
  id: string,
  patch: Partial<
    Pick<
      Staff,
      "name" | "shortName" | "role" | "isOwner" | "workdays" | "shiftStart" | "shiftEnd" | "serviceIds"
    >
  >,
): Promise<Staff | undefined> {
  // Translate domain patch → row columns (booleans→int, arrays→json).
  const row: Partial<typeof staff.$inferInsert> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.shortName !== undefined) row.shortName = patch.shortName;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.isOwner !== undefined) row.isOwner = patch.isOwner ? 1 : 0;
  if (patch.workdays !== undefined) row.workdays = JSON.stringify(patch.workdays);
  if (patch.shiftStart !== undefined) row.shiftStart = patch.shiftStart;
  if (patch.shiftEnd !== undefined) row.shiftEnd = patch.shiftEnd;
  if (patch.serviceIds !== undefined) row.serviceIds = JSON.stringify(patch.serviceIds);

  const rows = await db()
    .update(staff)
    .set(row)
    .where(and(eq(staff.tenantId, tenantId), eq(staff.id, id)))
    .returning();
  return rows[0] ? toStaff(rows[0]) : undefined;
}

// ---- Clients ----

export async function addClient(
  tenantId: string,
  input: { name: string; phone: string; email: string; notes: string },
): Promise<Client> {
  const id = genId("c");
  const client: Client = {
    id,
    tenantId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    totalSpendCents: 0,
    visits: 0,
    noShows: 0,
    notes: input.notes,
  };
  await db().insert(clients).values(client);
  return client;
}

// ---- Search ----

export async function searchTenant(
  tenantId: string,
  query: string,
): Promise<{ clients: Client[]; appointments: AppointmentDetail[] }> {
  const q = query.trim().toLowerCase();
  if (!q) return { clients: [], appointments: [] };

  const [allClients, allAppts] = await Promise.all([
    getClients(tenantId),
    getAppointmentsInRange(tenantId, "0000-01-01", "9999-12-31"),
  ]);

  const matchedClients = allClients
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    )
    .slice(0, 6);

  const matchedAppts = allAppts
    .filter(
      (a) =>
        a.client.name.toLowerCase().includes(q) || a.service.name.toLowerCase().includes(q),
    )
    .slice(0, 6);

  return { clients: matchedClients, appointments: matchedAppts };
}
