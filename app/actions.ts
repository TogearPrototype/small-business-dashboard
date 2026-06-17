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
  const tenant = await getDefaultTenant();
  await setAppointmentStatus(tenant.id, id, status);
  revalidatePath("/operator/calendar");
  revalidatePath("/operator/dashboard");
  // Status transitions adjust client visits/spend/no-shows.
  revalidatePath("/operator/clients");
}

export async function submitBooking(
  input: Omit<NewBookingInput, "tenantId">,
): Promise<{ id: string; ref: string }> {
  const tenant = await getDefaultTenant();
  const appt = await createBooking({ ...input, tenantId: tenant.id });
  revalidatePath("/operator/calendar");
  revalidatePath("/operator/dashboard");
  return { id: appt.id, ref: await bookingRef(tenant.id, appt.id) };
}

export async function rescheduleAppt(
  id: string,
  date: string,
  startTime: string,
  staffId?: string,
) {
  const tenant = await getDefaultTenant();
  await rescheduleAppointment(tenant.id, id, date, startTime, staffId);
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
  const tenant = await getDefaultTenant();
  const appt = await getAppointmentByRef(tenant.id, ref);
  if (!appt) return { ok: false };
  await rescheduleAppointment(tenant.id, appt.id, date, startTime, staffId);
  revalidatePath("/operator/calendar");
  revalidatePath("/operator/dashboard");
  return { ok: true };
}

/** Cancel a public booking identified by its ref. */
export async function cancelByRef(ref: string): Promise<{ ok: boolean }> {
  const tenant = await getDefaultTenant();
  const appt = await getAppointmentByRef(tenant.id, ref);
  if (!appt) return { ok: false };
  await setAppointmentStatus(tenant.id, appt.id, "cancelled");
  revalidatePath("/operator/calendar");
  revalidatePath("/operator/dashboard");
  // Cancelling can remove a prior completed/no-show contribution.
  revalidatePath("/operator/clients");
  return { ok: true };
}

export async function fetchSlots(
  tenantSlug: string,
  serviceId: string,
  date: string,
  staffId?: string,
): Promise<{ morning: Slot[]; afternoon: Slot[]; all: Slot[] }> {
  const all = await getAvailableSlots(tenantSlug, serviceId, date, staffId);
  const { morning, afternoon } = groupSlots(all);
  return { morning, afternoon, all };
}

export async function saveBranding(patch: {
  brandColor?: string;
  customDomain?: string | null;
  name?: string;
  tagline?: string;
}) {
  const tenant = await getDefaultTenant();
  await updateTenantBranding(tenant.id, patch);
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
  const tenant = await getDefaultTenant();
  await updateTenantProfile(tenant.id, input);
  // Name/tagline appear in the sidebar + topbar, so revalidate the whole shell.
  revalidatePath("/operator", "layout");
}

// ---- Settings: business hours ----

export async function saveBusinessHours(hours: BusinessHours) {
  const tenant = await getDefaultTenant();
  await setBusinessHours(tenant.id, hours);
  // Hours drive the public booking calendar window tenant-wide.
  revalidatePath("/operator", "layout");
}

// ---- Settings: notifications ----

export async function saveNotificationPrefs(prefs: NotificationPrefs) {
  const tenant = await getDefaultTenant();
  await setNotificationPrefs(tenant.id, prefs);
  revalidatePath("/operator/settings/notifications");
}

// ---- Settings: payments ----

export async function savePaymentSettings(settings: PaymentSettings) {
  const tenant = await getDefaultTenant();
  await setPaymentSettings(tenant.id, settings);
  revalidatePath("/operator/settings/payments");
}

// ---- Services ----

export async function createServiceAction(input: {
  name: string;
  category: string;
  durationMin: number;
  priceCents: number;
}): Promise<Service> {
  const tenant = await getDefaultTenant();
  const service = await createService(tenant.id, input);
  revalidatePath("/operator", "layout");
  return service;
}

export async function updateServiceAction(
  id: string,
  patch: Partial<Pick<Service, "name" | "category" | "durationMin" | "priceCents">>,
): Promise<Service | undefined> {
  const tenant = await getDefaultTenant();
  const service = await updateService(tenant.id, id, patch);
  revalidatePath("/operator", "layout");
  return service;
}

export async function deleteServiceAction(id: string): Promise<{ ok: boolean }> {
  const tenant = await getDefaultTenant();
  const ok = await deleteService(tenant.id, id);
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
  const tenant = await getDefaultTenant();
  const member = await createStaff(tenant.id, input);
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
  const tenant = await getDefaultTenant();
  const member = await updateStaff(tenant.id, id, patch);
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
  const tenant = await getDefaultTenant();
  const client = await addClient(tenant.id, input);
  revalidatePath("/operator/clients");
  return { id: client.id };
}

// ---- Search ----

export async function searchAction(
  query: string,
): Promise<{ clients: Client[]; appointments: AppointmentDetail[] }> {
  const tenant = await getDefaultTenant();
  return searchTenant(tenant.id, query);
}
