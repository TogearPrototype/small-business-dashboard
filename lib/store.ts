import type {
  Appointment,
  AppointmentDetail,
  AppointmentStatus,
  Client,
  Service,
  Staff,
  Tenant,
} from "./types";
import { addMinutes } from "./utils";
import {
  appointments as seedAppointments,
  clients as seedClients,
  services as seedServices,
  staff as seedStaff,
  tenants as seedTenants,
} from "./seed-data";

/**
 * In-memory data store seeded from the Lumen demo data.
 *
 * This is the single data-access layer the UI talks to. When you connect Neon
 * (set USE_DATABASE=true and DATABASE_URL), swap these reads for Drizzle
 * queries in lib/db/queries.ts — the function signatures here are the contract.
 *
 * NOTE: module-level mutable state resets on every server restart and is NOT
 * safe for real multi-user writes. It exists purely so the product is
 * explorable without a database. Mutations (status changes, new bookings)
 * persist only for the life of the server process.
 */

const data = {
  tenants: [...seedTenants] as Tenant[],
  staff: [...seedStaff] as Staff[],
  services: [...seedServices] as Service[],
  clients: [...seedClients] as Client[],
  appointments: [...seedAppointments] as Appointment[],
};

let apptCounter = data.appointments.length;

// ---- Tenants ----

export function getTenant(slug: string): Tenant | undefined {
  return data.tenants.find((t) => t.slug === slug);
}

export function getDefaultTenant(): Tenant {
  return data.tenants[0];
}

export function updateTenantBranding(
  tenantId: string,
  patch: Partial<Pick<Tenant, "brandColor" | "logoUrl" | "customDomain" | "name" | "tagline">>,
): Tenant | undefined {
  const t = data.tenants.find((x) => x.id === tenantId);
  if (t) Object.assign(t, patch);
  return t;
}

// ---- Staff / services / clients ----

export function getStaff(tenantId: string): Staff[] {
  return data.staff.filter((s) => s.tenantId === tenantId);
}

export function getStaffMember(tenantId: string, id: string): Staff | undefined {
  return data.staff.find((s) => s.tenantId === tenantId && s.id === id);
}

export function getServices(tenantId: string): Service[] {
  return data.services.filter((s) => s.tenantId === tenantId);
}

export function getService(tenantId: string, id: string): Service | undefined {
  return data.services.find((s) => s.tenantId === tenantId && s.id === id);
}

export function getClients(tenantId: string): Client[] {
  return data.clients
    .filter((c) => c.tenantId === tenantId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getClient(tenantId: string, id: string): Client | undefined {
  return data.clients.find((c) => c.tenantId === tenantId && c.id === id);
}

// ---- Appointments ----

function hydrate(tenantId: string, a: Appointment): AppointmentDetail {
  return {
    ...a,
    client: getClient(tenantId, a.clientId)!,
    staff: getStaffMember(tenantId, a.staffId)!,
    service: getService(tenantId, a.serviceId)!,
    endTime: addMinutes(a.startTime, a.durationMin),
  };
}

export function getAppointments(tenantId: string, date: string): AppointmentDetail[] {
  return data.appointments
    .filter((a) => a.tenantId === tenantId && a.date === date)
    .map((a) => hydrate(tenantId, a))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Appointments within an inclusive ISO date range [from, to]. */
export function getAppointmentsInRange(
  tenantId: string,
  from: string,
  to: string,
): AppointmentDetail[] {
  return data.appointments
    .filter((a) => a.tenantId === tenantId && a.date >= from && a.date <= to)
    .map((a) => hydrate(tenantId, a))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

export function getAppointment(tenantId: string, id: string): AppointmentDetail | undefined {
  const a = data.appointments.find((x) => x.tenantId === tenantId && x.id === id);
  return a ? hydrate(tenantId, a) : undefined;
}

export function setAppointmentStatus(
  tenantId: string,
  id: string,
  status: AppointmentStatus,
): AppointmentDetail | undefined {
  const a = data.appointments.find((x) => x.tenantId === tenantId && x.id === id);
  if (!a) return undefined;
  a.status = status;
  return hydrate(tenantId, a);
}

/** Move an appointment to a new date/time and optionally a new staff member. */
export function rescheduleAppointment(
  tenantId: string,
  id: string,
  date: string,
  startTime: string,
  staffId?: string,
): AppointmentDetail | undefined {
  const a = data.appointments.find((x) => x.tenantId === tenantId && x.id === id);
  if (!a) return undefined;
  a.date = date;
  a.startTime = startTime;
  if (staffId) a.staffId = staffId;
  return hydrate(tenantId, a);
}

/**
 * Human-friendly booking reference, e.g. "LUM-0021". Deterministic from the
 * tenant slug + the appointment id's digits, so the same appointment always
 * resolves to the same ref (used by the public Manage-booking flow).
 */
export function bookingRef(tenantId: string, appointmentId: string): string {
  const tenant = data.tenants.find((t) => t.id === tenantId);
  const prefix = (tenant?.slug ?? "bkg").slice(0, 3).toUpperCase();
  const digits = appointmentId.replace(/\D/g, "").padStart(4, "0").slice(-4);
  return `${prefix}-${digits}`;
}

/** Resolve an appointment from its booking ref (case-insensitive). */
export function getAppointmentByRef(
  tenantId: string,
  ref: string,
): AppointmentDetail | undefined {
  const target = ref.trim().toUpperCase();
  const match = data.appointments.find(
    (a) => a.tenantId === tenantId && bookingRef(tenantId, a.id) === target,
  );
  return match ? hydrate(tenantId, match) : undefined;
}

export interface NewBookingInput {
  tenantId: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
}

/** Creates a client (if new) + a pending appointment. Returns the detail. */
export function createBooking(input: NewBookingInput): AppointmentDetail {
  const service = getService(input.tenantId, input.serviceId)!;

  let client = data.clients.find(
    (c) => c.tenantId === input.tenantId && c.phone === input.clientPhone,
  );
  if (!client) {
    client = {
      id: `c_${++apptCounter}`,
      tenantId: input.tenantId,
      name: input.clientName,
      phone: input.clientPhone,
      email: input.clientEmail,
      totalSpendCents: 0,
      visits: 0,
      noShows: 0,
      notes: input.notes,
    };
    data.clients.push(client);
  }

  const appt: Appointment = {
    id: `a_${++apptCounter}`,
    tenantId: input.tenantId,
    clientId: client.id,
    staffId: input.staffId,
    serviceId: input.serviceId,
    date: input.date,
    startTime: input.startTime,
    durationMin: service.durationMin,
    priceCents: service.priceCents,
    status: "pending",
    payment: "Unpaid",
    notes: input.notes,
  };
  data.appointments.push(appt);
  return hydrate(input.tenantId, appt);
}
