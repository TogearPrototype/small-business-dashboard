import Link from "next/link";
import { getDefaultTenant } from "@/lib/store";

// Reads the tenant from the data layer per request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const tenant = await getDefaultTenant();
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ ["--brand" as string]: tenant.brandColor }}
    >
      <div className="w-full max-w-[520px]">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[11px] bg-brand font-display text-[19px] font-bold text-white">
            {tenant.logoMark}
          </span>
          <div>
            <div className="font-display text-[20px] font-semibold">{tenant.name}</div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              Scheduling Platform
            </div>
          </div>
        </div>

        <h1 className="mb-3 font-display text-[34px] font-bold leading-[1.1] tracking-[-0.02em]">
          A white-label scheduling platform for small businesses.
        </h1>
        <p className="mb-9 text-[15px] font-medium leading-[1.6] text-ink-soft">
          One product family: a data-dense operator app for running the day, and a branded,
          mobile-first booking site for clients. Both recolor from a single brand token.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/operator/dashboard"
            className="flex h-[52px] flex-1 items-center justify-center rounded-[13px] bg-brand text-[14.5px] font-semibold text-white transition-[filter] hover:brightness-95"
          >
            Open operator app →
          </Link>
          <Link
            href={`/book/${tenant.slug}`}
            className="flex h-[52px] flex-1 items-center justify-center rounded-[13px] border border-line bg-surface text-[14.5px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            View booking site
          </Link>
        </div>
      </div>
    </div>
  );
}
