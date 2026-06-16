"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Tenant } from "@/lib/types";
import { cx } from "@/lib/utils";

/** Shown when /book/[slug]/manage is opened without a valid ?ref. */
export function ManageLookup({ tenant, notFound }: { tenant: Tenant; notFound?: boolean }) {
  const router = useRouter();
  const [ref, setRef] = useState("");

  function go() {
    if (!ref.trim()) return;
    router.push(`/book/${tenant.slug}/manage?ref=${encodeURIComponent(ref.trim())}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-0 sm:p-6">
      <div className="flex min-h-screen w-full flex-col overflow-hidden bg-surface sm:min-h-0 sm:h-[760px] sm:w-[390px] sm:rounded-[34px] sm:border sm:border-line sm:shadow-[0_6px_22px_rgba(0,0,0,.09)]">
        <div className="flex h-[42px] flex-shrink-0 items-center justify-between px-6 text-[13px] font-bold">
          <span className="tnum">9:41</span>
          <span className="h-[10px] w-[18px] rounded-[2px] border-[1.5px] border-ink" />
        </div>
        <div className="flex items-center gap-[9px] border-b border-line-soft px-[22px] py-[14px]">
          <span className="flex size-6 items-center justify-center rounded-[7px] bg-brand text-[12px] font-bold text-white">
            {tenant.logoMark}
          </span>
          <span className="text-[14px] font-bold">{tenant.name}</span>
        </div>

        <div className="flex flex-1 flex-col px-[22px] pt-8">
          <div className="font-display text-[22px] font-semibold tracking-[-0.01em]">
            Manage your booking
          </div>
          <div className="mb-6 mt-1 text-[13px] font-medium leading-[1.5] text-ink-faint">
            Enter the booking reference from your confirmation (e.g. {tenant.slug.slice(0, 3).toUpperCase()}-0012).
          </div>

          {notFound && (
            <div
              className="mb-4 rounded-[11px] px-4 py-3 text-[12.5px] font-medium leading-[1.5]"
              style={{ background: "#f5e9e6", color: "#7e3f30" }}
            >
              We couldn’t find a booking with that reference. Check it and try again.
            </div>
          )}

          <input
            value={ref}
            onChange={(e) => setRef(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="LUM-0012"
            className="tnum mb-4 h-[48px] w-full rounded-[12px] border border-line px-4 text-[15px] font-semibold tracking-[0.04em]"
          />
          <button
            onClick={go}
            disabled={!ref.trim()}
            className={cx(
              "flex h-[50px] items-center justify-center rounded-[13px] bg-brand text-[15px] font-bold text-white transition-[filter] hover:brightness-95",
              !ref.trim() && "opacity-40",
            )}
          >
            Find my booking
          </button>

          <a
            href={`/book/${tenant.slug}`}
            className="mt-auto pb-[26px] pt-6 text-center text-[12.5px] font-semibold text-brand"
          >
            ← Make a new booking
          </a>
        </div>
      </div>
    </div>
  );
}
