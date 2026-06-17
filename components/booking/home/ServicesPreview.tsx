import Link from "next/link";
import type { Service } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/**
 * Services preview grid for the tenant home page. Shows a handful of real
 * services (name, category, duration, price) as cards that all deep-link into
 * the booking funnel at ./book. Purely presentational — services are passed in.
 */
export function ServicesPreview({
  slug,
  services,
}: {
  slug: string;
  services: Service[];
}) {
  if (services.length === 0) return null;

  // Show up to six on the landing page; the funnel lists the full menu.
  const preview = services.slice(0, 6);
  const base = `/book/${slug}`;

  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-semibold tracking-[-0.01em] sm:text-[28px]">
            Our services
          </h2>
          <p className="mt-1.5 text-[14px] font-medium text-ink-faint">
            Tap any service to book it in seconds.
          </p>
        </div>
        <Link
          href={`${base}/book`}
          className="hidden flex-shrink-0 text-[13.5px] font-semibold text-brand hover:underline sm:inline"
        >
          View all →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((s) => (
          <Link
            key={s.id}
            href={`${base}/book`}
            className="tnum group flex flex-col rounded-[16px] border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-brand hover:shadow-[0_4px_18px_rgba(0,0,0,.06)]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-ghost">
              {s.category}
            </span>
            <span className="mt-2 font-display text-[17px] font-bold tracking-[-0.01em] text-ink">
              {s.name}
            </span>
            <span className="mt-1 text-[12.5px] font-medium text-ink-faint">
              {s.durationMin} min
            </span>
            <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
              <span className="font-display text-[18px] font-bold text-ink">
                {formatPrice(s.priceCents)}
              </span>
              <span className="text-[13px] font-semibold text-brand transition-transform group-hover:translate-x-0.5">
                Book →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href={`${base}/book`}
        className="mt-5 flex h-12 items-center justify-center rounded-[12px] border border-line text-[14px] font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand sm:hidden"
      >
        View all services
      </Link>
    </section>
  );
}
