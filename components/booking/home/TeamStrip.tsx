import type { Staff } from "@/lib/types";

/** First-letter(s) initials for an avatar tile, e.g. "Maya Chen" → "MC". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * "Meet the team" strip for the tenant home page. Brand-tinted initials
 * avatars + name + role for each real staff member. Presentational — staff
 * passed in from the server component.
 */
export function TeamStrip({ staff }: { staff: Staff[] }) {
  if (staff.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16">
      <h2 className="font-display text-[24px] font-semibold tracking-[-0.01em] sm:text-[28px]">
        Meet the team
      </h2>
      <p className="mt-1.5 text-[14px] font-medium text-ink-faint">
        Friendly specialists ready to take care of you.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-[14px] sm:grid-cols-3 lg:grid-cols-5">
        {staff.map((m) => (
          <div
            key={m.id}
            className="flex flex-col items-center rounded-[16px] border border-line bg-surface px-4 py-6 text-center"
          >
            <span
              className="flex size-[58px] items-center justify-center rounded-full font-display text-[18px] font-bold text-brand"
              style={{ background: "color-mix(in oklch, var(--brand) 12%, white)" }}
            >
              {initialsOf(m.name)}
            </span>
            <span className="mt-3 text-[14px] font-bold tracking-[-0.01em] text-ink">
              {m.name}
            </span>
            <span className="mt-0.5 text-[12px] font-medium text-ink-faint">
              {m.role}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
