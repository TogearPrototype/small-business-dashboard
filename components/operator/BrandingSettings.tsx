"use client";

import { useState, useTransition } from "react";
import type { Tenant } from "@/lib/types";
import { saveBranding } from "@/app/actions";
import { cx } from "@/lib/utils";

const PRESET_COLORS = [
  { hex: "#6d4760", name: "plum" },
  { hex: "#9a5b43", name: "terracotta" },
  { hex: "#4a6350", name: "forest" },
  { hex: "#9a7434", name: "amber" },
  { hex: "#356b73", name: "teal-petrol" },
];

const SUBNAV = ["Business profile", "Branding", "Business hours", "Notifications", "Payments"];

export function BrandingSettings({ tenant }: { tenant: Tenant }) {
  const [color, setColor] = useState(tenant.brandColor);
  const [domain, setDomain] = useState(tenant.customDomain ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await saveBranding({ brandColor: color, customDomain: domain || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    // Local --brand override so the whole panel (incl. live preview) reflects
    // the in-progress color before it's saved to the tenant.
    <div className="fade-in flex h-full" style={{ ["--brand" as string]: color }}>
      {/* subnav */}
      <div className="w-[200px] flex-shrink-0 border-r border-line bg-field px-4 py-6">
        <div className="px-2 pb-4 font-display text-[18px] font-semibold tracking-[-0.01em]">
          Settings
        </div>
        <div className="flex flex-col gap-0.5">
          {SUBNAV.map((item) => (
            <div
              key={item}
              className={cx(
                "rounded-[8px] px-[10px] py-2 text-[13px] font-semibold",
                item === "Branding" ? "bg-line-soft text-ink" : "text-ink-faint",
              )}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* form + preview */}
      <div className="flex flex-1 gap-10 overflow-auto px-[34px] py-[30px]">
        <div className="max-w-[440px] flex-1">
          <div className="mb-1 font-display text-[22px] font-semibold tracking-[-0.01em]">
            Branding
          </div>
          <div className="mb-7 text-[13.5px] font-medium leading-[1.5] text-ink-faint">
            Your brand color and logo apply across the operator app and your public booking site.
          </div>

          {/* logo */}
          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Logo</div>
          <div className="mb-[26px] flex items-center gap-[14px]">
            <div className="flex size-16 items-center justify-center rounded-[14px] bg-brand font-display text-[26px] font-bold text-white">
              {tenant.logoMark}
            </div>
            <div className="flex h-16 flex-1 items-center justify-center gap-[7px] rounded-[12px] border-[1.5px] border-dashed border-[#c4c4c8] text-[12.5px] font-medium text-ink-ghost">
              <span className="size-4 rounded-[4px] border-[1.5px] border-[#c4c4c8]" />
              Drop a PNG or SVG, or browse
            </div>
          </div>

          {/* brand color */}
          <div className="mb-1 text-[12.5px] font-semibold text-ink-soft">
            Brand color <span className="font-mono text-[11px] text-ink-ghost">--brand</span>
          </div>
          <div className="mb-3 text-[12px] font-medium leading-[1.5] text-ink-ghost">
            One token. Layout, type and spacing stay identical — only this changes.
          </div>
          <div className="mb-[14px] flex items-center gap-3">
            <label className="ring-brand relative size-[46px] cursor-pointer overflow-hidden rounded-[11px] bg-brand">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <div className="tnum flex h-[46px] flex-1 items-center rounded-[10px] border border-line px-[14px] font-mono text-[14px] font-semibold uppercase text-ink-soft">
              {color}
            </div>
          </div>
          <div className="mb-7 flex gap-[10px]">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                className="size-[30px] rounded-[8px]"
                style={{ background: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* custom domain */}
          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Custom domain</div>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="book.yourbusiness.com"
            className="tnum mb-1.5 h-[44px] w-full rounded-[10px] border border-line px-[14px] text-[13.5px] font-medium"
          />
          <div className="mb-7 flex items-center gap-[7px] text-[12px] font-medium text-ink-faint">
            <span className="flex size-[14px] items-center justify-center rounded-full bg-[#d4d4d8] text-[8px] font-bold text-ink-soft">
              ✓
            </span>
            {domain ? "Connected · SSL active" : "Not connected yet"}
          </div>

          <div className="flex items-center gap-[10px]">
            <button
              onClick={save}
              disabled={pending}
              className="flex h-[42px] items-center rounded-[10px] bg-brand px-5 text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-50"
            >
              {pending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
            </button>
            <button
              onClick={() => {
                setColor(tenant.brandColor);
                setDomain(tenant.customDomain ?? "");
              }}
              className="flex h-[42px] items-center rounded-[10px] border border-line px-5 text-[13.5px] font-semibold text-ink-faint hover:bg-field"
            >
              Reset
            </button>
          </div>
        </div>

        {/* live preview */}
        <div className="w-[340px] flex-shrink-0">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-ghost">
            Live preview
          </div>
          {/* mini operator */}
          <div className="mb-4 overflow-hidden rounded-[12px] border border-line">
            <div className="flex items-center gap-2 border-b border-line-soft px-[14px] py-[11px]">
              <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-brand text-[9px] font-bold text-white">
                {tenant.logoMark}
              </span>
              <span className="text-[12px] font-bold">{tenant.name.split(" ")[0]}</span>
              <span className="ml-auto flex h-6 items-center rounded-[7px] bg-brand px-[10px] text-[10px] font-semibold text-white">
                + New
              </span>
            </div>
            <div className="px-[14px] py-[13px]">
              <div className="tnum mb-2 flex items-center gap-[7px]">
                <span className="text-[9px] font-bold text-brand">11:24</span>
                <span className="now-dot size-[6px] rounded-full bg-brand" />
                <span className="h-0.5 flex-1 rounded-[2px] bg-brand" />
              </div>
              <div className="flex h-[30px] items-center rounded-[6px] border-l-[3px] border-[#3f3f46] bg-[#f4f4f5] px-2 text-[10.5px] font-semibold text-ink-soft">
                12:00 · Bianca R.
              </div>
            </div>
          </div>
          {/* mini booking */}
          <div className="overflow-hidden rounded-[12px] border border-line">
            <div className="border-b border-line-soft px-[14px] py-3 text-[12px] font-bold">
              Public booking
            </div>
            <div className="flex flex-col gap-[7px] px-[14px] py-[13px]">
              <div className="tnum flex gap-1.5">
                <span className="flex h-7 flex-1 items-center justify-center rounded-[7px] border border-line text-[10.5px] font-semibold text-ink-faint">
                  10:30
                </span>
                <span className="flex h-7 flex-1 items-center justify-center rounded-[7px] bg-brand text-[10.5px] font-semibold text-white">
                  11:00
                </span>
                <span className="flex h-7 flex-1 items-center justify-center rounded-[7px] border border-line text-[10.5px] font-semibold text-ink-faint">
                  11:30
                </span>
              </div>
              <div className="flex h-8 items-center justify-center rounded-[8px] bg-brand text-[11.5px] font-semibold text-white">
                Confirm booking
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11.5px] font-medium leading-[1.5] text-ink-ghost">
            Swap the token to any hue — the two surfaces recolor together, nothing else moves.
          </div>
        </div>
      </div>
    </div>
  );
}
