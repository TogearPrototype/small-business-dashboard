import type { Tenant } from "@/lib/types";
import { to12h } from "@/lib/utils";

/**
 * Public-website footer for a tenant's booking site. A plain (server-friendly)
 * component — receives the resolved tenant and renders contact + hours summary.
 * Rendered by the /book/[slug] layout beneath every customer page.
 */
export function PublicFooter({ tenant }: { tenant: Tenant }) {
  const hours = `${to12h(tenant.openTime)} – ${to12h(tenant.closeTime)}`;

  return (
    <footer className="mt-auto border-t border-line-soft bg-surface">
      <div className="mx-auto w-full max-w-[1080px] px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-[280px]">
            <div className="flex items-center gap-[10px]">
              <span className="flex size-7 items-center justify-center rounded-[8px] bg-brand text-[13px] font-bold text-white">
                {tenant.logoMark}
              </span>
              <span className="font-display text-[15px] font-semibold">{tenant.name}</span>
            </div>
            {tenant.tagline && (
              <p className="mt-2 text-[12.5px] font-medium leading-[1.5] text-ink-faint">
                {tenant.tagline}
              </p>
            )}
          </div>

          <div className="text-[12.5px] font-medium leading-[1.7] text-ink-soft">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-ghost">
              Visit
            </div>
            <div>{tenant.address}</div>
            <div className="tnum">{tenant.phone}</div>
            <div>{tenant.email}</div>
          </div>

          <div className="text-[12.5px] font-medium leading-[1.7] text-ink-soft">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-ghost">
              Hours
            </div>
            <div className="tnum">Mon – Sat · {hours}</div>
            <div className="text-ink-faint">Sunday · Closed</div>
          </div>
        </div>

        <div className="mt-8 border-t border-line-soft pt-5 text-[11.5px] font-medium text-ink-ghost">
          Powered by Lumen
        </div>
      </div>
    </footer>
  );
}
