"use client";

import { useState } from "react";
import type { Service, Staff, Weekday } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/utils";
import { StaffEditor } from "@/components/operator/StaffEditor";

/** Compress sorted workdays into a label like "Mon–Fri" or "Wed, Sat, Sun". */
function workdaysLabel(days: Weekday[]): string {
  if (days.length === 0) return "—";
  const sorted = [...days].sort((a, b) => a - b);
  // Detect a contiguous run.
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (contiguous && sorted.length > 2) {
    return `${WEEKDAY_LABELS[sorted[0]]}–${WEEKDAY_LABELS[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => WEEKDAY_LABELS[d]).join(", ");
}

export function StaffView({
  staff: initialStaff,
  services,
}: {
  staff: Staff[];
  services: Service[];
}) {
  // Local copy so add/edit reflects immediately; the action also revalidates
  // the layout so a navigation reload stays consistent.
  const [staff, setStaff] = useState(initialStaff);
  // null = closed; "new" = add; a Staff = edit that member.
  const [editing, setEditing] = useState<Staff | "new" | null>(null);

  function serviceNames(ids: string[]): string[] {
    return ids
      .map((id) => services.find((s) => s.id === id)?.name)
      .filter((n): n is string => Boolean(n));
  }

  function handleSaved(saved: Staff) {
    setStaff((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
    });
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="fade-in mx-auto max-w-[680px] px-7 pb-14 pt-[22px]">
        <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">Staff</div>
            <button
              onClick={() => setEditing("new")}
              className="flex h-9 items-center gap-[7px] rounded-[9px] bg-brand px-[14px] text-[13px] font-semibold text-white transition-[filter] hover:brightness-95"
            >
              <span className="text-[15px]">+</span>Add member
            </button>
          </div>
          <div className="px-6 pb-5 pt-2">
            {staff.map((s) => (
              <div key={s.id} className="flex gap-[14px] border-b border-line-soft py-4 last:border-b-0">
                <span
                  className="size-11 flex-shrink-0 rounded-full"
                  style={{ background: "#e0e0e4" }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-[15px] font-bold">{s.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-line px-[9px] py-[3px] text-[11px] font-semibold text-ink-faint">
                        {s.isOwner ? `Owner · ${s.role}` : s.role}
                      </span>
                      <button
                        onClick={() => setEditing(s)}
                        className="rounded-[7px] border border-line px-[10px] py-[4px] text-[11px] font-semibold text-ink-faint hover:bg-field"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="tnum my-[6px] mb-[9px] text-[12px] font-medium text-ink-faint">
                    {workdaysLabel(s.workdays)} · {s.shiftStart}–{s.shiftEnd}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {serviceNames(s.serviceIds).map((name) => (
                      <span
                        key={name}
                        className="rounded-[6px] px-2 py-[3px] text-[11px] font-semibold text-ink-soft"
                        style={{ background: "#f0eef2" }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing !== null && (
        <StaffEditor
          staff={editing === "new" ? null : editing}
          services={services}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
