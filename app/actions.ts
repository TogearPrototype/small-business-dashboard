"use server";

import { revalidatePath } from "next/cache";
import {
  addClient,
  bookingRef,
  createBooking,
  createService,
  createStaff,
  getAppointmentByRef,
  getDefaultTenant,
  rescheduleAppointment,
  searchTenant,
  setAppointmentStatus,
  setBusinessHours,
  setNotificationPrefs,
  setPaymentSettings,
  updateService,
  deleteService,
  updateStaff,
  updateTenantBranding,
  updateTenantProfile,
  type NewBookingInput,
} from "@/lib/store";
import { getAvailableSlots, groupSlots, type Slot } from "@/lib/availability";
import type {
  AppointmentDetail,
  AppointmentStatus,
  BusinessHours,
  Client,
  NotificationPrefs,
  PaymentSettings,
  Service,
  Staff,
  Weekday,
} from "@/lib/types";

/**
 * Server actions. These run against the in-memory store today; when Neon is
 * wired (USE_DATABASE=true) the store functions become Drizzle queries and
 * these signatures stay the same.
 */

export async function changeAppointmentStatus(id: string, status: AppointmentStatus) {
  const tenant = getDefaultTenant();
  setAppointmentStatus(tenant.id, id, status);
  revalidatePath("/operator/calendar");
  revalidatePath("/operator/dashboard");
}

export async function submitBooking(
  input: Omit<NewBookingInput, "tenantId">,
): Promise<{ id: string; ref: string }> {
  const tenant = getDefaultTenant();
  const appt = createBooking({ ...input, tenantId: tenant.id });
  revalidatePath("/operator/calendar");
  revalidatePath("/operator/dashboard");
  return { id: appt.id, ref: bookingRef(tenant.id, appt.id) };
}

export async function rescheduleAppt(
  id: string,
  date: string,
  startTime: string,
  staffId?: string,
) {
  const tenant = getDefaultTenant();
  rescheduleAppointment(tenant.id, id, date, startTime, staffId);
  revalidatePath("/operator/calendar");
  revalidatePath("/operator/dashboard");
}

/** Reschedule a public booking identified by its ref. Returns the new ref echo. */
export async function rescheduleByRef(
  ref: string,
  date: string,
  startTime: string,
  staffId: string,
): Promise<{ ok: boolean }> {
  const tenant = getDefaultTenant();
  const appt = getAppointmentByRef(tenant.id, ref);
  if (!appt) return { ok: false };
  rescheduleAppointment(tenant.id, appt.id, date, startTime, staffId);
  revalidatePath("/operator/calendar");
  revalidatePath("/operator/dashboard");
  return { ok: true };
}

/** Cancel a public booking identified by its ref. */
export async function cancelByRef(ref: string): Promise<{ ok: boolean }> {
  const tenant = getDefaultTenant();
  const appt = getAppointmentByRef(tenant.id, ref);
  if (!appt) return { ok: false };
  setAppointmentStatus(tenant.id, appt.id, "cancelled");
  revalidatePath("/operator/calendar");
  revalidatePath("/operator/dashboard");
  return { ok: true };
}

export async function fetchSlots(
  tenantSlug: string,
  serviceId: string,
  date: string,
  staffId?: string,
): Promise<{ morning: Slot[]; afternoon: Slot[]; all: Slot[] }> {
  const all = getAvailableSlots(tenantSlug, serviceId, date, staffId);
  const { morning, afternoon } = groupSlots(all);
  return { morning, afternoon, all };
}

export async function saveBranding(patch: {
  brandColor?: string;
  customDomain?: string | null;
  name?: string;
  tagline?: string;
}) {
  const tenant = getDefaultTenant();
  updateTenantBranding(tenant.id, patch);
  revalidatePath("/operator", "layout");
  revalidatePath("/operator/settings");
}

// ---- Settings: business profile ----

export async function saveBusinessProfile(input: {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
}) {
  const tenant = getDefaultTenant();
  updateTenantProfile(tenant.id, input);
  // Name/tagline appear in the sidebar + topbar, so revalidate the whole shell.
  revalidatePath("/operator", "layout");
}

// ---- Settings: business hours ----

export async function saveBusinessHours(hours: BusinessHours) {
  const tenant = getDefaultTenant();
  setBusinessHours(tenant.id, hours);
  // Hours drive the public booking calendar window tenant-wide.
  revalidatePath("/operator", "layout");
}

// ---- Settings: notifications ----

export async function saveNotificationPrefs(prefs: NotificationPrefs) {
  const tenant = getDefaultTenant();
  setNotificationPrefs(tenant.id, prefs);
  revalidatePath("/operator/settings/notifications");
}

// ---- Settings: payments ----

export async function savePaymentSettings(settings: PaymentSettings) {
  const tenant = getDefaultTenant();
  setPaymentSettings(tenant.id, settings);
  revalidatePath("/operator/settings/payments");
}

// ---- Services ----

export async function createServiceAction(input: {
  name: string;
  category: string;
  durationMin: number;
  priceCents: number;
}): Promise<Service> {
  const tenant = getDefaultTenant();
  const service = createService(tenant.id, input);
  revalidatePath("/operator", "layout");
  return service;
}

export async function updateServiceAction(
  id: string,
  patch: Partial<Pick<Service, "name" | "category" | "durationMin" | "priceCents">>,
): Promise<Service | undefined> {
  const tenant = getDefaultTenant();
  const service = updateService(tenant.id, id, patch);
  revalidatePath("/operator", "layout");
  return service;
}

export async function deleteServiceAction(id: string): Promise<{ ok: boolean }> {
  const tenant = getDefaultTenant();
  const ok = deleteService(tenant.id, id);
  revalidatePath("/operator", "layout");
  return { ok };
}

// ---- Staff ----

export async function createStaffAction(input: {
  name: string;
  shortName: string;
  role: string;
  workdays: Weekday[];
  shiftStart: string;
  shiftEnd: string;
  serviceIds: string[];
  isOwner?: boolean;
}): Promise<Staff> {
  const tenant = getDefaultTenant();
  const member = createStaff(tenant.id, input);
  revalidatePath("/operator", "layout");
  return member;
}

export async function updateStaffAction(
  id: string,
  patch: Partial<
    Pick<
      Staff,
      | "name"
      | "shortName"
      | "role"
      | "isOwner"
      | "workdays"
      | "shiftStart"
      | "shiftEnd"
      | "serviceIds"
    >
  >,
): Promise<Staff | undefined> {
  const tenant = getDefaultTenant();
  const member = updateStaff(tenant.id, id, patch);
  revalidatePath("/operator", "layout");
  return member;
}

// ---- Clients ----

export async function addClientAction(input: {
  name: string;
  phone: string;
  email: string;
  notes: string;
}): Promise<{ id: string }> {
  const tenant = getDefaultTenant();
  const client = addClient(tenant.id, input);
  revalidatePath("/operator/clients");
  return { id: client.id };
}

// ---- Search ----

export async function searchAction(
  query: string,
): Promise<{ clients: Client[]; appointments: AppointmentDetail[] }> {
  const tenant = getDefaultTenant();
  return searchTenant(tenant.id, query);
}
