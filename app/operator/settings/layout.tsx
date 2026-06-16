"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/operator/Topbar";
import { cx } from "@/lib/utils";

/**
 * Settings shell. The left subnav links to each settings tab; the active route
 * is highlighted via usePathname. The Topbar lives here so every tab page only
 * needs to render its own form. The tenant slug is fixed for this single-tenant
 * demo (the Topbar only uses it for the search affordance).
 */

const NAV = [
  { label: "Business profile", href: "/operator/settings/business" },
  { label: "Branding", href: "/operator/settings/branding" },
  { label: "Business hours", href: "/operator/settings/hours" },
  { label: "Notifications", href: "/operator/settings/notifications" },
  { label: "Payments", href: "/operator/settings/payments" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Topbar title="Settings" subtitle="Manage your business" tenantSlug="lumen" />
      <div className="flex flex-1 overflow-hidden">
        {/* subnav */}
        <div className="w-[200px] flex-shrink-0 border-r border-line bg-field px-4 py-6">
          <div className="px-2 pb-4 font-display text-[18px] font-semibold tracking-[-0.01em]">
            Settings
          </div>
          <div className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "rounded-[8px] px-[10px] py-2 text-[13px] font-semibold transition-colors",
                    active ? "bg-line-soft text-ink" : "text-ink-faint hover:text-ink-soft",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* tab content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </>
  );
}
