import type { Staff } from "./types";
import { getAppointments, getServices, getStaff, getTenant } from "./store";
import { addMinutes, toMinutes } from "./utils";

/**
 * Availability engine — computes open start-times for a service on a given
 * date, respecting staff working days/shifts, existing bookings, the service
 * duration, and the tenant's operating window.
 *
 * This is intentionally simple (no buffers, resources, or concurrency locks
 * yet) but it's the seam where the real scheduling engine will live. When
 * moving to Neon, double-booking must be prevented with a DB-level exclusion
 * constraint, not just this in-memory check.
 */

const SLOT_GRANULARITY_MIN = 15;

export interface Slot {
  /** "HH:MM" 24h start time. */
  time: string;
  staffId: string;
  staffName: string;
}

interface Busy {
  start: number;
  end: number;
}

function dateWeekday(iso: string): number {
  return new Date(iso + "T00:00:00").getDay();
}

function staffBusyRanges(tenantId: string, date: string, staffId: string): Busy[] {
  return getAppointments(tenantId, date)
    .filter((a) => a.staffId === staffId && a.status !== "cancelled")
    .map((a) => ({
      start: toMinutes(a.startTime),
      end: toMinutes(a.startTime) + a.durationMin,
    }));
}

function staffCanWork(staff: Staff, weekday: number): boolean {
  return staff.workdays.includes(weekday as Staff["workdays"][number]);
}

/** Open start-times for `serviceId` on `date`, optionally pinned to one staff. */
export function getAvailableSlots(
  tenantId: string,
  serviceId: string,
  date: string,
  staffId?: string,
): Slot[] {
  // In the store, tenantId is the same key as the slug.
  const tenant = getTenant(tenantId);
  const service = getServices(tenantId).find((s) => s.id === serviceId);
  if (!service || !tenant) return [];

  const weekday = dateWeekday(date);
  const openMin = toMinutes(tenant.openTime);
  const closeMin = toMinutes(tenant.closeTime);

  const candidates = getStaff(tenantId).filter(
    (s) =>
      s.serviceIds.includes(serviceId) &&
      (!staffId || s.id === staffId) &&
      staffCanWork(s, weekday),
  );

  const slots: Slot[] = [];
  for (const member of candidates) {
    const shiftStart = Math.max(openMin, toMinutes(member.shiftStart));
    const shiftEnd = Math.min(closeMin, toMinutes(member.shiftEnd));
    const busy = staffBusyRanges(tenantId, date, member.id);

    for (let t = shiftStart; t + service.durationMin <= shiftEnd; t += SLOT_GRANULARITY_MIN) {
      const end = t + service.durationMin;
      const conflicts = busy.some((b) => t < b.end && end > b.start);
      if (!conflicts) {
        const hh = String(Math.floor(t / 60)).padStart(2, "0");
        const mm = String(t % 60).padStart(2, "0");
        slots.push({ time: `${hh}:${mm}`, staffId: member.id, staffName: member.name });
      }
    }
  }

  // For "no preference", collapse to unique times (earliest-available staff wins).
  if (!staffId) {
    const byTime = new Map<string, Slot>();
    for (const s of slots.sort((a, b) => a.time.localeCompare(b.time))) {
      if (!byTime.has(s.time)) byTime.set(s.time, s);
    }
    return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time));
}

/** Group slots into Morning (<12:00) and Afternoon (>=12:00). */
export function groupSlots(slots: Slot[]): { morning: Slot[]; afternoon: Slot[] } {
  const morning: Slot[] = [];
  const afternoon: Slot[] = [];
  for (const s of slots) {
    (toMinutes(s.time) < 12 * 60 ? morning : afternoon).push(s);
  }
  return { morning, afternoon };
}

export { addMinutes };
