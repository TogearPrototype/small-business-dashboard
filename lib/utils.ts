import type { AppointmentStatus } from "./types";

/** Tailwind-friendly className joiner. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** "09:00" + 180 → "12:00" */
export function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** "09:30" → 570 (minutes since midnight). */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 18000 (cents) → "$180". Drops trailing ".00". */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars)
    ? `$${dollars.toLocaleString()}`
    : `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

/** 18000 → "$180.00" (always two decimals, for detail views). */
export function formatPriceExact(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "Elena Marsh" → "Elena M." */
export function shortNameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[1][0]}.`;
}

/** Convert "14:30" (24h) to "2:30 PM". */
export function to12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export interface StatusStyle {
  label: string;
  bg: string;
  rail: string;
  dot: string;
  title: string;
  sub: string;
}

/** Status color system from the design — neutral so brand color stays distinct. */
export const STATUS_STYLES: Record<AppointmentStatus, StatusStyle> = {
  confirmed: { label: "Confirmed", bg: "#e9f1ec", rail: "#4f9b74", dot: "#4f9b74", title: "#234b39", sub: "#4a7a62" },
  pending: { label: "Pending", bg: "#f7f0e2", rail: "#c79338", dot: "#c79338", title: "#6f521d", sub: "#917341" },
  completed: { label: "Completed", bg: "#eeeef0", rail: "#a8a8b0", dot: "#a8a8b0", title: "#56545c", sub: "#87858f" },
  noshow: { label: "No-show", bg: "#f5e9e6", rail: "#c06a54", dot: "#c06a54", title: "#7e3f30", sub: "#a5604f" },
  cancelled: { label: "Cancelled", bg: "#fbfbfc", rail: "#d4d4d8", dot: "#d4d4d8", title: "#a1a1aa", sub: "#bcbcc2" },
};

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

/** Format "2026-06-15" → "Mon, Jun 15". */
export function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** Format "2026-06-15" → "Monday, June 15". */
export function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
