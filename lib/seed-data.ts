import type { Appointment, Client, Service, Staff, Tenant } from "./types";

/**
 * Demo tenant "Lumen Studio" — transcribed from the Claude Design scope so
 * the app is populated and explorable with zero database setup. This same
 * data structure is what `lib/db/seed.ts` writes into Neon.
 *
 * The "today" the demo revolves around is 2026-06-15 (Monday), matching the
 * design's now-line at 11:24.
 */

/** The demo's "today" — the day the now-line and dashboard revolve around. */
export const DEMO_DATE = "2026-06-15";

/** The demo's "current time" in minutes since midnight (11:24), used for the
 *  now-line and "happening now"/"up next" splits. Only meaningful on DEMO_DATE. */
export const DEMO_NOW_MINUTES = 11 * 60 + 24;

export const tenants: Tenant[] = [
  {
    id: "lumen",
    slug: "lumen",
    name: "Lumen Studio",
    tagline: "Hair & Skin",
    logoMark: "L",
    logoUrl: null,
    brandColor: "#6d4a63",
    customDomain: "book.lumenstudio.com",
    address: "24 Pearl St",
    timezone: "America/Los_Angeles",
    openTime: "09:00",
    closeTime: "18:00",
    cancellationWindowHours: 24,
  },
];

export const staff: Staff[] = [
  {
    id: "maya",
    tenantId: "lumen",
    name: "Maya Chen",
    shortName: "Maya",
    role: "Stylist",
    isOwner: true,
    avatarColor: "#ece9ef",
    workdays: [1, 2, 3, 4, 5],
    shiftStart: "09:00",
    shiftEnd: "17:00",
    serviceIds: ["womens-cut", "mens-cut", "keratin"],
  },
  {
    id: "devin",
    tenantId: "lumen",
    name: "Devin Brooks",
    shortName: "Devin",
    role: "Stylist",
    isOwner: false,
    avatarColor: "#ece9ef",
    workdays: [3, 4, 5, 6, 0],
    shiftStart: "09:00",
    shiftEnd: "17:00",
    serviceIds: ["womens-cut", "mens-cut"],
  },
  {
    id: "priya",
    tenantId: "lumen",
    name: "Priya Anand",
    shortName: "Priya",
    role: "Colorist",
    isOwner: false,
    avatarColor: "#ece9ef",
    workdays: [2, 3, 4, 5, 6],
    shiftStart: "10:00",
    shiftEnd: "18:00",
    serviceIds: ["full-color", "balayage", "gloss"],
  },
  {
    id: "sasha",
    tenantId: "lumen",
    name: "Sasha Romano",
    shortName: "Sasha",
    role: "Stylist",
    isOwner: false,
    avatarColor: "#ece9ef",
    workdays: [1, 2, 3, 4, 5],
    shiftStart: "09:00",
    shiftEnd: "17:00",
    serviceIds: ["womens-cut", "mens-cut"],
  },
  {
    id: "noor",
    tenantId: "lumen",
    name: "Noor Haddad",
    shortName: "Noor",
    role: "Esthetician",
    isOwner: false,
    avatarColor: "#ece9ef",
    workdays: [1, 2, 3, 4],
    shiftStart: "10:00",
    shiftEnd: "18:00",
    serviceIds: ["signature-facial", "deep-cleanse"],
  },
];

export const services: Service[] = [
  { id: "womens-cut", tenantId: "lumen", name: "Women’s Cut", category: "Hair", durationMin: 45, priceCents: 6500 },
  { id: "mens-cut", tenantId: "lumen", name: "Men’s Cut", category: "Hair", durationMin: 30, priceCents: 4000 },
  { id: "keratin", tenantId: "lumen", name: "Keratin Treatment", category: "Hair", durationMin: 90, priceCents: 16000 },
  { id: "full-color", tenantId: "lumen", name: "Full Color", category: "Color", durationMin: 120, priceCents: 12000 },
  { id: "balayage", tenantId: "lumen", name: "Balayage", category: "Color", durationMin: 180, priceCents: 18000 },
  { id: "gloss", tenantId: "lumen", name: "Gloss / Toner", category: "Color", durationMin: 45, priceCents: 5500 },
  { id: "signature-facial", tenantId: "lumen", name: "Signature Facial", category: "Skin", durationMin: 60, priceCents: 9500 },
  { id: "deep-cleanse", tenantId: "lumen", name: "Deep-Cleanse Facial", category: "Skin", durationMin: 75, priceCents: 11000 },
];

export const clients: Client[] = [
  { id: "elena", tenantId: "lumen", name: "Elena Marsh", phone: "(415) 555-0148", email: "elena.marsh@email.com", totalSpendCents: 124000, visits: 11, noShows: 0, notes: "Prefers cooler tones. Allergy: PPD — patch test done 04/12." },
  { id: "bianca", tenantId: "lumen", name: "Bianca Rossi", phone: "(415) 555-0192", email: "bianca.r@email.com", totalSpendCents: 88000, visits: 7, noShows: 1, notes: "Going one shade darker than last visit." },
  { id: "grace", tenantId: "lumen", name: "Grace Lin", phone: "(415) 555-0177", email: "grace.lin@email.com", totalSpendCents: 61000, visits: 5, noShows: 0, notes: "Sensitive skin — avoid fragrance." },
  { id: "jordan", tenantId: "lumen", name: "Jordan Lee", phone: "(415) 555-0103", email: "jordan.lee@email.com", totalSpendCents: 39500, visits: 4, noShows: 0, notes: "" },
  { id: "mei", tenantId: "lumen", name: "Mei Tanaka", phone: "(415) 555-0150", email: "mei.tanaka@email.com", totalSpendCents: 170500, visits: 14, noShows: 0, notes: "" },
  { id: "hassan", tenantId: "lumen", name: "Hassan Ali", phone: "(415) 555-0166", email: "hassan.ali@email.com", totalSpendCents: 0, visits: 0, noShows: 0, notes: "First visit — confirm by text." },
  { id: "tom", tenantId: "lumen", name: "Tom Whitfield", phone: "(415) 555-0121", email: "tom.w@email.com", totalSpendCents: 24000, visits: 6, noShows: 0, notes: "" },
  { id: "owen", tenantId: "lumen", name: "Owen Pratt", phone: "(415) 555-0139", email: "owen.pratt@email.com", totalSpendCents: 32000, visits: 2, noShows: 0, notes: "" },
  { id: "ravi", tenantId: "lumen", name: "Ravi Kapoor", phone: "(415) 555-0185", email: "ravi.k@email.com", totalSpendCents: 8000, visits: 2, noShows: 2, notes: "Second no-show this quarter." },
  { id: "lucas", tenantId: "lumen", name: "Lucas Fenn", phone: "(415) 555-0110", email: "lucas.fenn@email.com", totalSpendCents: 13000, visits: 3, noShows: 0, notes: "" },
  { id: "carla", tenantId: "lumen", name: "Carla Núñez", phone: "(415) 555-0172", email: "carla.n@email.com", totalSpendCents: 22000, visits: 3, noShows: 0, notes: "" },
];

/**
 * Appointments for the demo day (2026-06-15). Times/durations match the
 * day-view grid in the design (column per staff, 09:00–18:00).
 */
export const appointments: Appointment[] = [
  { id: "a1", tenantId: "lumen", clientId: "elena", staffId: "priya", serviceId: "balayage", date: DEMO_DATE, startTime: "09:00", durationMin: 180, priceCents: 18000, status: "confirmed", payment: "Unpaid", notes: "Prefers cooler tones. Allergy: PPD — patch test done 04/12." },
  { id: "a2", tenantId: "lumen", clientId: "bianca", staffId: "priya", serviceId: "full-color", date: DEMO_DATE, startTime: "12:00", durationMin: 120, priceCents: 12000, status: "confirmed", payment: "Paid", notes: "Going one shade darker than last visit." },
  { id: "a3", tenantId: "lumen", clientId: "mei", staffId: "priya", serviceId: "gloss", date: DEMO_DATE, startTime: "14:15", durationMin: 45, priceCents: 5500, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a4", tenantId: "lumen", clientId: "hassan", staffId: "maya", serviceId: "mens-cut", date: DEMO_DATE, startTime: "11:00", durationMin: 30, priceCents: 4000, status: "pending", payment: "Unpaid", notes: "First visit — confirm by text." },
  { id: "a5", tenantId: "lumen", clientId: "owen", staffId: "maya", serviceId: "keratin", date: DEMO_DATE, startTime: "15:00", durationMin: 90, priceCents: 16000, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a6", tenantId: "lumen", clientId: "tom", staffId: "devin", serviceId: "mens-cut", date: DEMO_DATE, startTime: "09:30", durationMin: 30, priceCents: 4000, status: "completed", payment: "Paid", notes: "" },
  { id: "a7", tenantId: "lumen", clientId: "ravi", staffId: "devin", serviceId: "mens-cut", date: DEMO_DATE, startTime: "14:00", durationMin: 30, priceCents: 4000, status: "noshow", payment: "Unpaid", notes: "Did not arrive. Second no-show this quarter." },
  { id: "a8", tenantId: "lumen", clientId: "lucas", staffId: "sasha", serviceId: "womens-cut", date: DEMO_DATE, startTime: "11:00", durationMin: 45, priceCents: 6500, status: "cancelled", payment: "Refunded", notes: "Cancelled 24h ahead — rebooked for next week." },
  { id: "a9", tenantId: "lumen", clientId: "jordan", staffId: "sasha", serviceId: "womens-cut", date: DEMO_DATE, startTime: "13:30", durationMin: 45, priceCents: 6500, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a10", tenantId: "lumen", clientId: "grace", staffId: "noor", serviceId: "signature-facial", date: DEMO_DATE, startTime: "10:15", durationMin: 60, priceCents: 9500, status: "confirmed", payment: "Unpaid", notes: "Sensitive skin — avoid fragrance." },
  { id: "a11", tenantId: "lumen", clientId: "carla", staffId: "noor", serviceId: "deep-cleanse", date: DEMO_DATE, startTime: "16:00", durationMin: 75, priceCents: 11000, status: "confirmed", payment: "Paid", notes: "" },

  // ---- Rest of the demo week (Tue Jun 16 – Sat Jun 20) ----
  // Staff workdays: Maya Mon–Fri · Devin Wed–Sun · Priya Tue–Sat · Sasha Mon–Fri · Noor Mon–Thu.

  // Tuesday, Jun 16
  { id: "a12", tenantId: "lumen", clientId: "mei", staffId: "priya", serviceId: "full-color", date: "2026-06-16", startTime: "10:00", durationMin: 120, priceCents: 12000, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a13", tenantId: "lumen", clientId: "jordan", staffId: "sasha", serviceId: "womens-cut", date: "2026-06-16", startTime: "11:30", durationMin: 45, priceCents: 6500, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a14", tenantId: "lumen", clientId: "grace", staffId: "noor", serviceId: "deep-cleanse", date: "2026-06-16", startTime: "13:00", durationMin: 75, priceCents: 11000, status: "pending", payment: "Unpaid", notes: "" },
  { id: "a15", tenantId: "lumen", clientId: "hassan", staffId: "maya", serviceId: "mens-cut", date: "2026-06-16", startTime: "15:30", durationMin: 30, priceCents: 4000, status: "confirmed", payment: "Unpaid", notes: "" },

  // Wednesday, Jun 17
  { id: "a16", tenantId: "lumen", clientId: "elena", staffId: "priya", serviceId: "gloss", date: "2026-06-17", startTime: "10:30", durationMin: 45, priceCents: 5500, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a17", tenantId: "lumen", clientId: "tom", staffId: "devin", serviceId: "mens-cut", date: "2026-06-17", startTime: "09:30", durationMin: 30, priceCents: 4000, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a18", tenantId: "lumen", clientId: "owen", staffId: "maya", serviceId: "keratin", date: "2026-06-17", startTime: "13:00", durationMin: 90, priceCents: 16000, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a19", tenantId: "lumen", clientId: "carla", staffId: "noor", serviceId: "signature-facial", date: "2026-06-17", startTime: "11:00", durationMin: 60, priceCents: 9500, status: "confirmed", payment: "Paid", notes: "" },

  // Thursday, Jun 18 — Balayage with Priya 10:30 (the slot the booking demo lands on)
  { id: "a20", tenantId: "lumen", clientId: "bianca", staffId: "priya", serviceId: "balayage", date: "2026-06-18", startTime: "10:30", durationMin: 180, priceCents: 18000, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a21", tenantId: "lumen", clientId: "lucas", staffId: "sasha", serviceId: "womens-cut", date: "2026-06-18", startTime: "14:00", durationMin: 45, priceCents: 6500, status: "pending", payment: "Unpaid", notes: "" },
  { id: "a22", tenantId: "lumen", clientId: "grace", staffId: "noor", serviceId: "signature-facial", date: "2026-06-18", startTime: "16:00", durationMin: 60, priceCents: 9500, status: "confirmed", payment: "Unpaid", notes: "Sensitive skin — avoid fragrance." },

  // Friday, Jun 19
  { id: "a23", tenantId: "lumen", clientId: "mei", staffId: "priya", serviceId: "balayage", date: "2026-06-19", startTime: "11:00", durationMin: 180, priceCents: 18000, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a24", tenantId: "lumen", clientId: "jordan", staffId: "maya", serviceId: "womens-cut", date: "2026-06-19", startTime: "09:30", durationMin: 45, priceCents: 6500, status: "confirmed", payment: "Paid", notes: "" },
  { id: "a25", tenantId: "lumen", clientId: "ravi", staffId: "devin", serviceId: "mens-cut", date: "2026-06-19", startTime: "15:00", durationMin: 30, priceCents: 4000, status: "pending", payment: "Unpaid", notes: "Confirm by text — prior no-shows." },

  // Saturday, Jun 20 (Maya & Sasha off; Priya & Devin in)
  { id: "a26", tenantId: "lumen", clientId: "elena", staffId: "priya", serviceId: "full-color", date: "2026-06-20", startTime: "10:00", durationMin: 120, priceCents: 12000, status: "confirmed", payment: "Unpaid", notes: "" },
  { id: "a27", tenantId: "lumen", clientId: "hassan", staffId: "devin", serviceId: "mens-cut", date: "2026-06-20", startTime: "12:30", durationMin: 30, priceCents: 4000, status: "confirmed", payment: "Unpaid", notes: "" },
];

/** Past visits per client, for the client profile history view. */
export const clientHistory: Record<string, Array<{ date: string; service: string; staff: string; priceCents: number }>> = {
  elena: [
    { date: "May 18", service: "Gloss / Toner", staff: "Priya Anand", priceCents: 5500 },
    { date: "Apr 06", service: "Full Color", staff: "Priya Anand", priceCents: 12000 },
    { date: "Mar 02", service: "Women’s Cut", staff: "Sasha Romano", priceCents: 6500 },
  ],
};
