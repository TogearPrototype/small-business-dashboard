"use server";

import { revalidatePath } from "next/cache";
import {
  createBooking,
  getDefaultTenant,
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
  // Human-friendly booking reference, e.g. LUM-4821.
  const ref = `${tenant.slug.slice(0, 3).toUpperCase()}-${appt.id.replace(/\D/g, "").padStart(4, "0").slice(-4)}`;
  return { id: appt.id, ref };
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
