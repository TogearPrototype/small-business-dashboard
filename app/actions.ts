"use server";

import { revalidatePath } from "next/cache";
import {
  bookingRef,
  createBooking,
  getAppointmentByRef,
  getDefaultTenant,
  rescheduleAppointment,
  setAppointmentStatus,
  updateTenantBranding,
  type NewBookingInput,
} from "@/lib/store";
import { getAvailableSlots, groupSlots, type Slot } from "@/lib/availability";
import type { AppointmentStatus } from "@/lib/types";

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
