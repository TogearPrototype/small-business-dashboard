import Link from "next/link";
import type { Tenant } from "@/lib/types";
import { to12h } from "@/lib/utils";

/**
 * Info / "visit us" section for the tenant home page: hours summary (derived
 * from openTime/closeTime with the site-wide Mon–Sat open, Sunday closed
 * convention — same as PublicFooter), address, phone, and email. Closes the
 * landing page with one more nudge into the booking funnel.
 */
export function InfoSection({ tenant }: { tenant: Tenant }) {
  const hours = `${to12h(tenant.openTime)} – ${to12h(tenant.closeTime)}`;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Hours", value: <span className="tnum">Mon – Sat · {hours}</span> },
    { label: "Address", value: tenant.address },
    {
      label: "Phone",
      value: (
        <a href={`tel:${tenant.phone.replace(/[^\d+]/g, "")}`} className="tnum hover:text-brand">
          {tenant.phone}
        </a>
      ),
    },
    {
      label: "Email",
      value: (
        <a href={`mailto:${tenant.email}`} className="hover:text-brand">
          {tenant.email}
        </a>
      ),
    },
  ];

  return (
    <section className="mt-12 sm:mt-16">
      <div className="grid grid-cols-1 gap-6 rounded-[22px] border border-line bg-surface p-6 sm:grid-cols-[1.1fr_0.9fr] sm:p-9">
        <div>
          <h2 className="font-display text-[24px] font-semibold tracking-[-0.01em] sm:text-[28px]">
            Visit us
          </h2>
          <p className="mt-1.5 max-w-[360px] text-[14px] font-medium leading-[1.6] text-ink-faint">
            Find us, give us a call, or book online whenever suits you.
          </p>
          <Link
            href={`/book/${tenant.slug}/book`}
            className="mt-6 inline-flex h-[50px] items-center justify-center rounded-[13px] bg-brand px-7 text-[15px] font-bold text-white transition-[filter] hover:brightness-95"
          >
            Book an appointment
          </Link>
        </div>

        <dl className="flex flex-col gap-4">
          {rows.map((r) => (
            <div key={r.label} className="border-b border-line-soft pb-4 last:border-0 last:pb-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-ghost">
                {r.label}
              </dt>
              <dd className="mt-1 text-[14.5px] font-semibold text-ink-soft">{r.value}</dd>
            </div>
          ))}
          <div className="text-[12.5px] font-medium text-ink-faint">Sunday · Closed</div>
        </dl>
      </div>
    </section>
  );
}
