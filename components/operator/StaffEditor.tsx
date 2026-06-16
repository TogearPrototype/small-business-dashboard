"use client";

import { useState, useTransition } from "react";
import type { Service, Staff, Weekday } from "@/lib/types";
import { createStaffAction, updateStaffAction } from "@/app/actions";
import { cx, shortNameOf, WEEKDAY_LABELS } from "@/lib/utils";

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/**
 * Add / edit a staff member. Modeled on NewAppointmentModal — a centered sheet
 * over a scrim. Editing day toggles, shift window and the service checklist;
 * writes through createStaffAction / updateStaffAction. On success the parent
 * receives the saved record via onSaved (handy for optimistic list updates).
 */
export function StaffEditor({
  staff,
  services,
  onClose,
  onSaved,
}: {
  /** Existing member to edit, or null for a new member. */
  staff: Staff | null;
  services: Service[];
  onClose: () => void;
  onSaved: (member: Staff) => void;
}) {
  const editing = staff !== null;
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(staff?.name ?? "");
  // Once the user edits the short name by hand we stop auto-suggesting it.
  const [shortNameTouched, setShortNameTouched] = useState(editing);
  const [shortName, setShortName] = useState(staff?.shortName ?? "");
  const [role, setRole] = useState(staff?.role ?? "");
  const [workdays, setWorkdays] = useState<Weekday[]>(staff?.workdays ?? [1, 2, 3, 4, 5]);
  const [shiftStart, setShiftStart] = useState(staff?.shiftStart ?? "09:00");
  const [shiftEnd, setShiftEnd] = useState(staff?.shiftEnd ?? "17:00");
  const [serviceIds, setServiceIds] = useState<string[]>(staff?.serviceIds ?? []);

  function onNameChange(value: string) {
    setName(value);
    if (!shortNameTouched) {
      // shortNameOf needs a last name to abbreviate; fall back to first name.
      const parts = value.trim().split(/\s+/);
      setShortName(parts.length >= 2 ? shortNameOf(value) : parts[0] ?? "");
    }
  }

  function toggleDay(day: Weekday) {
    setWorkdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  }

  function toggleService(id: string) {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  const valid = name.trim() !== "" && shortName.trim() !== "" && role.trim() !== "";

  function save() {
    if (!valid) return;
    const input = {
      name: name.trim(),
      shortName: shortName.trim(),
      role: role.trim(),
      workdays,
      shiftStart,
      shiftEnd,
      serviceIds,
    };
    startTransition(async () => {
      const result = editing
        ? await updateStaffAction(staff.id, input)
        : await createStaffAction(input);
      if (result) onSaved(result);
      onClose();
    });
  }

  return (
    <div className="fade-in fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[rgba(40,40,46,.32)]" onClick={onClose} />
      <div className="sheet-in absolute left-1/2 top-1/2 flex max-h-[88vh] w-[480px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-auto rounded-[18px] border border-line bg-surface p-7 shadow-[0_24px_60px_rgba(40,40,46,.2)]">
        <div className="flex items-start justify-between">
          <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            {editing ? "Edit member" : "Add member"}
          </div>
          <button
            onClick={onClose}
            className="flex size-[34px] items-center justify-center rounded-[10px] border border-line text-[17px] text-ink-faint hover:bg-field"
          >
            ×
          </button>
        </div>

        <Field label="Name">
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Full name"
            className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
          />
        </Field>

        <div className="flex gap-3">
          <Field label="Short name" className="flex-1">
            <input
              value={shortName}
              onChange={(e) => {
                setShortNameTouched(true);
                setShortName(e.target.value);
              }}
              placeholder="Elena M."
              className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
            />
          </Field>
          <Field label="Role" className="flex-1">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Stylist"
              className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
            />
          </Field>
        </div>

        <Field label="Workdays">
          <div className="flex gap-[7px]">
            {WEEKDAYS.map((day) => {
              const on = workdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cx(
                    "flex h-[38px] flex-1 items-center justify-center rounded-[9px] border text-[12px] font-semibold transition-colors",
                    on
                      ? "border-brand bg-brand-tint text-brand"
                      : "border-line text-ink-faint hover:bg-field",
                  )}
                >
                  {WEEKDAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="flex gap-3">
          <Field label="Shift start" className="flex-1">
            <input
              type="time"
              value={shiftStart}
              onChange={(e) => setShiftStart(e.target.value)}
              className="tnum h-[42px] w-full rounded-[10px] border border-line bg-field px-3 text-[13.5px] font-medium"
            />
          </Field>
          <Field label="Shift end" className="flex-1">
            <input
              type="time"
              value={shiftEnd}
              onChange={(e) => setShiftEnd(e.target.value)}
              className="tnum h-[42px] w-full rounded-[10px] border border-line bg-field px-3 text-[13.5px] font-medium"
            />
          </Field>
        </div>

        <Field label="Services">
          {services.length === 0 ? (
            <div className="rounded-[10px] border border-line px-3 py-3 text-[12.5px] font-medium text-ink-ghost">
              No services yet.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {services.map((s) => {
                const on = serviceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={cx(
                      "flex items-center gap-[10px] rounded-[10px] border px-3 py-[10px] text-left transition-colors",
                      on ? "border-brand bg-brand-tint" : "border-line hover:bg-field",
                    )}
                  >
                    <span
                      className={cx(
                        "flex size-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border text-[11px] font-bold text-white",
                        on ? "border-brand bg-brand" : "border-[#c4c4c8]",
                      )}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="text-[13px] font-semibold text-ink">{s.name}</span>
                    <span className="ml-auto text-[11.5px] font-medium text-ink-faint">
                      {s.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        <div className="mt-1 flex items-center justify-end gap-[9px]">
          <button
            onClick={onClose}
            className="flex h-[42px] items-center justify-center rounded-[11px] border border-line px-5 text-[13px] font-semibold text-ink-faint hover:bg-field"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!valid || pending}
            className={cx(
              "flex h-[42px] items-center justify-center rounded-[11px] bg-brand px-5 text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95",
              (!valid || pending) && "opacity-50",
            )}
          >
            {pending ? "Saving…" : editing ? "Save changes" : "Add member"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <div className="mb-[7px] text-[12px] font-semibold text-ink-soft">{label}</div>
      {children}
    </label>
  );
}
