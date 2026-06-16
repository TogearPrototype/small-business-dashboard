/**
 * Domain model for the appointments vertical.
 *
 * Everything is scoped to a tenant (one salon/clinic). In the multi-tenant
 * SaaS, every row carries `tenantId` and Postgres RLS enforces isolation.
 * The in-memory store and the Drizzle schema both follow these shapes.
 */

export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "completed"
  | "noshow"
  | "cancelled";

export type PaymentStatus = "Paid" | "Unpaid" | "Refunded";

/** Days of week as 0 (Sun) – 6 (Sat), matching JS Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Tenant {
  id: string;
  /** URL slug + subdomain key, e.g. "lumen" → lumen.bookwith.app */
  slug: string;
  name: string;
  tagline: string;
  /** Single-letter mark shown in the logo tile until a logo is uploaded. */
  logoMark: string;
  logoUrl: string | null;
  /** The one white-label lever — drives --brand across both surfaces. */
  brandColor: string;
  /** Optional connected custom domain, e.g. "book.lumenstudio.com". */
  customDomain: string | null;
  address: string;
  timezone: string;
  /** Operating window for the calendar grid, 24h "HH:MM". */
  openTime: string;
  closeTime: string;
  /** Hours before an appointment that free cancellation/reschedule ends. */
  cancellationWindowHours: number;
}

export interface Staff {
  id: string;
  tenantId: string;
  name: string;
  /** Short first-name label used in calendar column headers. */
  shortName: string;
  role: string;
  isOwner: boolean;
  avatarColor: string;
  /** Days this member works. */
  workdays: Weekday[];
  shiftStart: string; // "HH:MM"
  shiftEnd: string; // "HH:MM"
  /** Service IDs this member can perform. */
  serviceIds: string[];
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  durationMin: number;
  priceCents: number;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  /** Lifetime spend in cents. */
  totalSpendCents: number;
  visits: number;
  noShows: number;
  notes: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  /** ISO date "YYYY-MM-DD" in the tenant timezone. */
  date: string;
  /** Start time "HH:MM" (24h). End is derived from service duration. */
  startTime: string;
  durationMin: number;
  priceCents: number;
  status: AppointmentStatus;
  payment: PaymentStatus;
  notes: string;
}

/** Appointment joined with its related records for display. */
export interface AppointmentDetail extends Appointment {
  client: Client;
  staff: Staff;
  service: Service;
  endTime: string;
}
