import type {
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
} from "./types";
import { isDatabaseEnabled } from "./db";
import * as mem from "./memory-store";
import * as dbq from "./db/queries";

/**
 * Data-access facade. Every function is async and dispatches to one of two
 * implementations based on the USE_DATABASE env flag:
 *   - Neon/Drizzle  → lib/db/queries.ts   (USE_DATABASE === "true")
 *   - in-memory     → lib/memory-store.ts (default; resets on restart)
 *
 * The UI and server actions only ever import from here, so flipping the flag
 * swaps the whole persistence layer with no caller changes. The in-memory
 * functions are synchronous; we await/wrap them so both branches share one
 * async signature.
 */

const USE_DB = isDatabaseEnabled;

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

// ---- Tenants ----

export async function getTenant(slug: string): Promise<Tenant | undefined> {
  return USE_DB ? dbq.getTenant(slug) : mem.getTenant(slug);
}

export async function getDefaultTenant(): Promise<Tenant> {
  return USE_DB ? dbq.getDefaultTenant() : mem.getDefaultTenant();
}

export async function updateTenantBranding(
  tenantId: string,
  patch: Partial<Pick<Tenant, "brandColor" | "logoUrl" | "customDomain" | "name" | "tagline">>,
): Promise<Tenant | undefined> {
  return USE_DB ? dbq.updateTenantBranding(tenantId, patch) : mem.updateTenantBranding(tenantId, patch);
}

export async function updateTenantProfile(
  tenantId: string,
  patch: Partial<Pick<Tenant, "name" | "tagline" | "address" | "phone" | "email" | "timezone">>,
): Promise<Tenant | undefined> {
  return USE_DB ? dbq.updateTenantProfile(tenantId, patch) : mem.updateTenantProfile(tenantId, patch);
}

// ---- Settings ----

export async function getBusinessHours(tenantId: string): Promise<BusinessHours> {
  return USE_DB ? dbq.getBusinessHours(tenantId) : mem.getBusinessHours(tenantId);
}

export async function setBusinessHours(tenantId: string, hours: BusinessHours): Promise<BusinessHours> {
  return USE_DB ? dbq.setBusinessHours(tenantId, hours) : mem.setBusinessHours(tenantId, hours);
}

export async function getNotificationPrefs(tenantId: string): Promise<NotificationPrefs> {
  return USE_DB ? dbq.getNotificationPrefs(tenantId) : mem.getNotificationPrefs(tenantId);
}

export async function setNotificationPrefs(
  tenantId: string,
  prefs: NotificationPrefs,
): Promise<NotificationPrefs> {
  return USE_DB ? dbq.setNotificationPrefs(tenantId, prefs) : mem.setNotificationPrefs(tenantId, prefs);
}

export async function getPaymentSettings(tenantId: string): Promise<PaymentSettings> {
  return USE_DB ? dbq.getPaymentSettings(tenantId) : mem.getPaymentSettings(tenantId);
}

export async function setPaymentSettings(
  tenantId: string,
  settings: PaymentSettings,
): Promise<PaymentSettings> {
  return USE_DB ? dbq.setPaymentSettings(tenantId, settings) : mem.setPaymentSettings(tenantId, settings);
}

// ---- Staff / services / clients ----

export async function getStaff(tenantId: string): Promise<Staff[]> {
  return USE_DB ? dbq.getStaff(tenantId) : mem.getStaff(tenantId);
}

export async function getStaffMember(tenantId: string, id: string): Promise<Staff | undefined> {
  return USE_DB ? dbq.getStaffMember(tenantId, id) : mem.getStaffMember(tenantId, id);
}

export async function getServices(tenantId: string): Promise<Service[]> {
  return USE_DB ? dbq.getServices(tenantId) : mem.getServices(tenantId);
}

export async function getService(tenantId: string, id: string): Promise<Service | undefined> {
  return USE_DB ? dbq.getService(tenantId, id) : mem.getService(tenantId, id);
}

export async function getClients(tenantId: string): Promise<Client[]> {
  return USE_DB ? dbq.getClients(tenantId) : mem.getClients(tenantId);
}

export async function getClient(tenantId: string, id: string): Promise<Client | undefined> {
  return USE_DB ? dbq.getClient(tenantId, id) : mem.getClient(tenantId, id);
}

// ---- Appointments ----

export async function getAppointments(tenantId: string, date: string): Promise<AppointmentDetail[]> {
  return USE_DB ? dbq.getAppointments(tenantId, date) : mem.getAppointments(tenantId, date);
}

export async function getAppointmentsInRange(
  tenantId: string,
  from: string,
  to: string,
): Promise<AppointmentDetail[]> {
  return USE_DB
    ? dbq.getAppointmentsInRange(tenantId, from, to)
    : mem.getAppointmentsInRange(tenantId, from, to);
}

export async function getAppointment(
  tenantId: string,
  id: string,
): Promise<AppointmentDetail | undefined> {
  return USE_DB ? dbq.getAppointment(tenantId, id) : mem.getAppointment(tenantId, id);
}

export async function setAppointmentStatus(
  tenantId: string,
  id: string,
  status: AppointmentStatus,
): Promise<AppointmentDetail | undefined> {
  return USE_DB ? dbq.setAppointmentStatus(tenantId, id, status) : mem.setAppointmentStatus(tenantId, id, status);
}

export async function rescheduleAppointment(
  tenantId: string,
  id: string,
  date: string,
  startTime: string,
  staffId?: string,
): Promise<AppointmentDetail | undefined> {
  return USE_DB
    ? dbq.rescheduleAppointment(tenantId, id, date, startTime, staffId)
    : mem.rescheduleAppointment(tenantId, id, date, startTime, staffId);
}

export async function bookingRef(tenantId: string, appointmentId: string): Promise<string> {
  return USE_DB ? dbq.bookingRef(tenantId, appointmentId) : mem.bookingRef(tenantId, appointmentId);
}

export async function getAppointmentByRef(
  tenantId: string,
  ref: string,
): Promise<AppointmentDetail | undefined> {
  return USE_DB ? dbq.getAppointmentByRef(tenantId, ref) : mem.getAppointmentByRef(tenantId, ref);
}

export async function createBooking(input: NewBookingInput): Promise<AppointmentDetail> {
  return USE_DB ? dbq.createBooking(input) : mem.createBooking(input);
}

// ---- Service CRUD ----

export async function createService(
  tenantId: string,
  input: { name: string; category: string; durationMin: number; priceCents: number },
): Promise<Service> {
  return USE_DB ? dbq.createService(tenantId, input) : mem.createService(tenantId, input);
}

export async function updateService(
  tenantId: string,
  id: string,
  patch: Partial<Pick<Service, "name" | "category" | "durationMin" | "priceCents">>,
): Promise<Service | undefined> {
  return USE_DB ? dbq.updateService(tenantId, id, patch) : mem.updateService(tenantId, id, patch);
}

export async function deleteService(tenantId: string, id: string): Promise<boolean> {
  return USE_DB ? dbq.deleteService(tenantId, id) : mem.deleteService(tenantId, id);
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
  return USE_DB ? dbq.createStaff(tenantId, input) : mem.createStaff(tenantId, input);
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
  return USE_DB ? dbq.updateStaff(tenantId, id, patch) : mem.updateStaff(tenantId, id, patch);
}

// ---- Clients ----

export async function addClient(
  tenantId: string,
  input: { name: string; phone: string; email: string; notes: string },
): Promise<Client> {
  return USE_DB ? dbq.addClient(tenantId, input) : mem.addClient(tenantId, input);
}

// ---- Search ----

export async function searchTenant(
  tenantId: string,
  query: string,
): Promise<{ clients: Client[]; appointments: AppointmentDetail[] }> {
  return USE_DB ? dbq.searchTenant(tenantId, query) : mem.searchTenant(tenantId, query);
}
