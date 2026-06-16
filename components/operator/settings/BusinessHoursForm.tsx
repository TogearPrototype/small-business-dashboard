"use client";

import { useState, useTransition } from "react";
import type { BusinessHours } from "@/lib/types";
import { saveBusinessHours } from "@/app/actions";
import { cx } from "@/lib/utils";

// Data is indexed 0=Sun..6=Sat, but the editor lists Mon first.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function BusinessHoursForm({ hours: initial }: { hours: BusinessHours }) {
  const [hours, setHours] = useState<BusinessHours>(() =>
    initial.map((d) => ({ ...d })),
  );
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function patchDay(idx: number, patch: Partial<BusinessHours[number]>) {
    setHours((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function save() {
    startTransition(async () => {
      await saveBusinessHours(hours.map((d) => ({ ...d })));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function reset() {
    setHours(initial.map((d) => ({ ...d })));
  }

  return (
    <div className="fade-in h-full overflow-auto px-[34px] py-[30px]">
      <div className="max-w-[560px]">
        <div className="mb-1 font-display text-[22px] font-semibold tracking-[-0.01em]">
          Business hours
        </div>
        <div className="mb-7 text-[13.5px] font-medium leading-[1.5] text-ink-faint">
          Set the days and times you accept bookings. Closed days are hidden from your public
          booking site.
        </div>

        <div className="overflow-hidden rounded-[13px] border border-line">
          {DISPLAY_ORDER.map((idx, row) => {
            const day = hours[idx];
            const open = day.open;
            return (
              <div
                key={idx}
                className={cx(
                  "flex items-center gap-[14px] px-[18px] py-[14px]",
                  row > 0 && "border-t border-line-soft",
                  !open && "bg-field",
                )}
              >
                <div className="w-[92px] flex-shrink-0 text-[13.5px] font-semibold text-ink">
                  {DAY_LABELS[idx]}
                </div>

                {/* open / closed toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={open}
                  onClick={() => patchDay(idx, { open: !open })}
                  className={cx(
                    "relative h-[22px] w-[38px] flex-shrink-0 rounded-full transition-colors",
                    open ? "bg-brand" : "bg-[#d4d4d8]",
                  )}
                  title={open ? "Open" : "Closed"}
                >
                  <span
                    className={cx(
                      "absolute top-[3px] size-[16px] rounded-full bg-white shadow-sm transition-[left]",
                      open ? "left-[19px]" : "left-[3px]",
                    )}
                  />
                </button>

                <div className="tnum flex flex-1 items-center gap-[9px]">
                  <input
                    type="time"
                    value={day.start}
                    disabled={!open}
                    onChange={(e) => patchDay(idx, { start: e.target.value })}
                    className="h-[36px] flex-1 rounded-[9px] border border-line px-[12px] text-[13.5px] font-semibold text-ink-soft disabled:cursor-not-allowed disabled:bg-field disabled:text-ink-ghost"
                  />
                  <span
                    className={cx(
                      "text-[13px] font-medium",
                      open ? "text-ink-ghost" : "text-ink-ghost/50",
                    )}
                  >
                    to
                  </span>
                  <input
                    type="time"
                    value={day.end}
                    disabled={!open}
                    onChange={(e) => patchDay(idx, { end: e.target.value })}
                    className="h-[36px] flex-1 rounded-[9px] border border-line px-[12px] text-[13.5px] font-semibold text-ink-soft disabled:cursor-not-allowed disabled:bg-field disabled:text-ink-ghost"
                  />
                  <span
                    className={cx(
                      "w-[52px] flex-shrink-0 text-[12px] font-semibold",
                      open ? "text-ink-ghost opacity-0" : "text-ink-ghost",
                    )}
                  >
                    Closed
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-7 flex items-center gap-[10px]">
          <button
            onClick={save}
            disabled={pending}
            className="flex h-[42px] items-center rounded-[10px] bg-brand px-5 text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-50"
          >
            {pending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
          <button
            onClick={reset}
            className="flex h-[42px] items-center rounded-[10px] border border-line px-5 text-[13.5px] font-semibold text-ink-faint hover:bg-field"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
