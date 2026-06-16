import Link from "next/link";
import { SearchBox } from "./SearchBox";

interface TopbarProps {
  title: string;
  subtitle: string;
  tenantSlug: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-line bg-surface px-7">
      <div>
        <div className="font-display text-[19px] font-semibold leading-[1.1]">{title}</div>
        <div className="text-[12.5px] font-medium text-ink-faint">{subtitle}</div>
      </div>
      <div className="flex items-center gap-[10px]">
        <SearchBox />
        <Link
          href="/operator/calendar?new=1"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-brand px-[17px] text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95"
          style={{ boxShadow: "0 1px 2px color-mix(in oklch, var(--brand) 40%, transparent)" }}
        >
          <span className="-mt-px text-[17px] leading-none">+</span>New appointment
        </Link>
      </div>
    </header>
  );
}
