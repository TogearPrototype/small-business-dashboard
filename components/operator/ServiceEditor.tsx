"use client";

import { useState, useTransition } from "react";
import type { Service } from "@/lib/types";
import { createServiceAction, updateServiceAction, deleteServiceAction } from "@/app/actions";
import { cx } from "@/lib/utils";

/**
 * Create / edit a single service. Imitates NewAppointmentModal's sheet pattern.
 * Price is shown in dollars in the UI and converted to cents on save. Staff
 * assignment is intentionally omitted here — it lives on the Staff page (each
 * staff member owns its serviceIds), so duplicating that here would create a
 * second source of truth.
 */
export function ServiceEditor({
  service,
  categories,
  onClose,
  onSaved,
}: {
  /** When provided, the modal edits this service; otherwise it creates a new one. */
  service: Service | null;
  /** Existing category names for the datalist suggestions. */
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = service !== null;
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(service?.name ?? "");
  const [category, setCategory] = useState(service?.category ?? categories[0] ?? "");
  const [durationMin, setDurationMin] = useState(String(service?.durationMin ?? 60));
  const [priceDollars, setPriceDollars] = useState(
    service ? String(service.priceCents / 100) : "",
  );

  const duration = Number.parseInt(durationMin, 10);
  const dollars = Number.parseFloat(priceDollars);
  const valid =
    name.trim().length > 0 &&
    category.trim().length > 0 &&
    Number.isFinite(duration) &&
    duration > 0 &&
    Number.isFinite(dollars) &&
    dollars >= 0;

  function save() {
    if (!valid) return;
    const input = {
      name: name.trim(),
      category: category.trim(),
      durationMin: duration,
      priceCents: Math.round(dollars * 100),
    };
    startTransition(async () => {
      if (isEdit && service) {
        await updateServiceAction(service.id, input);
      } else {
        await createServiceAction(input);
      }
      onSaved();
    });
  }

  function remove() {
    if (!service) return;
    if (!window.confirm(`Delete "${service.name}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteServiceAction(service.id);
      onSaved();
    });
  }

  return (
    <div className="fade-in absolute inset-0 z-50">
      <div className="absolute inset-0 bg-[rgba(40,40,46,.32)]" onClick={onClose} />
      <div className="sheet-in absolute left-1/2 top-1/2 flex w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[18px] border border-line bg-surface p-7 shadow-[0_24px_60px_rgba(40,40,46,.2)]">
        <div className="flex items-start justify-between">
          <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            {isEdit ? "Edit service" : "New service"}
          </div>
          <button
            onClick={onClose}
            className="flex size-[34px] items-center justify-center rounded-[10px] border border-line text-[17px] text-ink-faint hover:bg-field"
          >
            ×
          </button>
        </div>

        <Field label="Service name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Signature Cut"
            className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
          />
        </Field>

        <Field label="Category">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Hair"
            list="service-categories"
            className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
          />
          <datalist id="service-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <div className="flex gap-3">
          <Field label="Duration (min)" className="flex-1">
            <input
              type="number"
              min={5}
              step={5}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="tnum h-[42px] w-full rounded-[10px] border border-line bg-field px-3 text-[13.5px] font-medium"
            />
          </Field>
          <Field label="Price ($)" className="flex-1">
            <input
              type="number"
              min={0}
              step="0.01"
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              placeholder="0"
              className="tnum h-[42px] w-full rounded-[10px] border border-line bg-field px-3 text-[13.5px] font-medium"
            />
          </Field>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <div>
            {isEdit && (
              <button
                onClick={remove}
                disabled={pending}
                className="flex h-[42px] items-center justify-center rounded-[11px] border border-line px-4 text-[13px] font-semibold text-[#c06a54] hover:bg-field disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-[9px]">
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
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add service"}
            </button>
          </div>
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
