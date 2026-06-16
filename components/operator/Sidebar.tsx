"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Tenant } from "@/lib/types";
import { cx } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  /** Geometric mark matching the design's CSS-shape icons. */
  shape: "square" | "calendar" | "circle" | "diamond";
}

const NAV: NavItem[] = [
  { href: "/operator/dashboard", label: "Dashboard", shape: "square" },
  { href: "/operator/calendar", label: "Calendar", shape: "calendar" },
  { href: "/operator/clients", label: "Clients", shape: "circle" },
  { href: "/operator/services", label: "Services", shape: "diamond" },
  { href: "/operator/staff", label: "Staff", shape: "circle" },
];

function NavMark({ shape }: { shape: NavItem["shape"] }) {
  if (shape === "calendar") {
    return (
      <span className="relative size-4 rounded-[5px] border-[1.6px] border-current opacity-90">
        <span className="absolute left-[2.5px] right-[2.5px] top-[3px] h-[1.6px] bg-current" />
      </span>
    );
  }
  return (
    <span
      className={cx(
        "size-4 border-[1.6px] border-current opacity-90",
        shape === "circle" ? "rounded-full" : "rounded-[5px]",
        shape === "diamond" && "rotate-45",
      )}
    />
  );
}

export function Sidebar({ tenant }: { tenant: Tenant }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[232px] flex-shrink-0 flex-col border-r border-line bg-surface px-4 py-5">
      <div className="flex items-center gap-[11px] px-2 pb-[22px] pt-1.5">
        <span
          className="flex size-8 items-center justify-center rounded-[9px] bg-brand font-display text-base font-bold text-white"
          aria-hidden
        >
          {tenant.logoMark}
        </span>
        <div className="leading-[1.15]">
          <div className="whitespace-nowrap font-display text-[15px] font-semibold">
            {tenant.name}
          </div>
          <div className="font-sans text-[9.5px] font-semibold tracking-[0.1em] text-ink-faint">
            {tenant.tagline.toUpperCase()}
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-[3px]">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex items-center gap-[11px] rounded-[9px] px-[11px] py-[9px] text-[13.5px] font-semibold transition-colors",
                active ? "text-brand" : "text-ink-soft hover:bg-line-soft",
              )}
              style={active ? { background: "color-mix(in oklch, var(--brand) 12%, white)" } : undefined}
            >
              <NavMark shape={item.shape} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-2 my-[14px] h-px bg-line-soft" />

      <Link
        href="/operator/settings"
        className={cx(
          "flex items-center gap-[11px] rounded-[9px] px-[11px] py-[9px] text-[13.5px] font-semibold transition-colors",
          pathname === "/operator/settings" ? "text-brand" : "text-ink-soft hover:bg-line-soft",
        )}
        style={
          pathname === "/operator/settings"
            ? { background: "color-mix(in oklch, var(--brand) 12%, white)" }
            : undefined
        }
      >
        <NavMark shape="square" />
        Settings
      </Link>

      <div className="mt-auto flex flex-col gap-3">
        <Link
          href={`/book/${tenant.slug}`}
          target="_blank"
          className="flex items-center gap-[9px] rounded-[11px] border border-line px-[13px] py-[11px] text-[12.5px] font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand"
        >
          <span className="size-[7px] rounded-full bg-brand" />
          View booking site ↗
        </Link>
        <div className="flex items-center gap-[10px] px-2 py-1.5">
          <span className="size-[30px] rounded-full" style={{ background: "#ece9ef" }} />
          <div className="leading-[1.2]">
            <div className="text-[12.5px] font-semibold">Maya Chen</div>
            <div className="text-[10.5px] font-medium text-ink-ghost">Owner</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
