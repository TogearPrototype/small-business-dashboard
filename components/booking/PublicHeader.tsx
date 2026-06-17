"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Tenant } from "@/lib/types";
import { cx } from "@/lib/utils";

/**
 * Real public-website header for a tenant's booking site. Rendered by the
 * /book/[slug] layout above every customer page (home, book, appointments,
 * manage). Receives the already-resolved tenant — never calls the store, since
 * it's a client component for active-link state.
 */
export function PublicHeader({ tenant }: { tenant: Tenant }) {
  const pathname = usePathname();
  const base = `/book/${tenant.slug}`;

  const links = [
    { href: base, label: "Home", match: (p: string) => p === base },
    { href: `${base}/book`, label: "Book", match: (p: string) => p.startsWith(`${base}/book`) },
    {
      href: `${base}/appointments`,
      label: "My bookings",
      match: (p: string) => p.startsWith(`${base}/appointments`) || p.startsWith(`${base}/manage`),
    },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-line-soft bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] w-full max-w-[1080px] items-center gap-3 px-5 sm:px-8">
        <Link href={base} className="flex items-center gap-[10px]">
          <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand font-display text-base font-bold text-white">
            {tenant.logoMark}
          </span>
          <span className="font-display text-[16px] font-semibold tracking-[-0.01em]">
            {tenant.name}
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "rounded-[9px] px-[10px] py-[7px] text-[13px] font-semibold transition-colors sm:px-[13px] sm:text-[13.5px]",
                  active ? "text-brand" : "text-ink-soft hover:bg-line-soft",
                )}
                style={
                  active
                    ? { background: "color-mix(in oklch, var(--brand) 12%, white)" }
                    : undefined
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
