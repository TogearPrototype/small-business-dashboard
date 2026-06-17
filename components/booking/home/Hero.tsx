import Link from "next/link";
import type { Tenant } from "@/lib/types";

/**
 * Landing hero for a tenant's public booking site. Brand-tinted panel with the
 * tenant name + tagline, a welcoming line, and the primary "Book an
 * appointment" CTA (-> ./book). Secondary link points at "My bookings"
 * (-> ./appointments). Rendered inside the site shell's <main>, so no width
 * wrapper of its own.
 */
export function Hero({ tenant }: { tenant: Tenant }) {
  const base = `/book/${tenant.slug}`;
  return (
    <section
      className="relative overflow-hidden rounded-[22px] border border-line bg-surface px-6 py-12 sm:px-12 sm:py-16"
      style={{ background: "color-mix(in oklch, var(--brand) 6%, white)" }}
    >
      {/* Soft brand wash in the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full blur-2xl"
        style={{ background: "color-mix(in oklch, var(--brand) 18%, transparent)" }}
      />

      <div className="relative max-w-[560px]">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand bg-surface px-[13px] py-[6px] text-[11.5px] font-semibold uppercase tracking-[0.06em] text-brand">
          <span className="size-[7px] rounded-full bg-brand" />
          Now booking
        </span>

        <h1 className="mt-5 font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[46px]">
          {tenant.name}
        </h1>

        {tenant.tagline && (
          <p className="mt-3 font-display text-[18px] font-medium tracking-[-0.01em] text-brand sm:text-[20px]">
            {tenant.tagline}
          </p>
        )}

        <p className="mt-4 max-w-[460px] text-[15px] font-medium leading-[1.6] text-ink-soft">
          Book your next visit in under a minute. Pick a service, choose your
          favorite specialist, and grab a time that works for you.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`${base}/book`}
            className="inline-flex h-[52px] items-center justify-center rounded-[13px] bg-brand px-7 text-[15px] font-bold text-white transition-[filter] hover:brightness-95"
          >
            Book an appointment
          </Link>
          <Link
            href={`${base}/appointments`}
            className="inline-flex h-[52px] items-center justify-center rounded-[13px] border border-line bg-surface px-6 text-[14px] font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand"
          >
            Manage a booking
          </Link>
        </div>
      </div>
    </section>
  );
}
