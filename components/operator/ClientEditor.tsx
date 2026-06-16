"use client";

import { useState, useTransition } from "react";
import { addClientAction } from "@/app/actions";
import { cx } from "@/lib/utils";

/**
 * Lightweight modal to create a new client (name / phone / email / notes).
 * Mirrors NewAppointmentModal's sheet layout. On success it returns the new
 * client id to the caller so the list can select it, then closes.
 */
export function ClientEditor({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  function save() {
    if (!name || !phone) return;
    startTransition(async () => {
      const { id } = await addClientAction({ name, phone, email, notes });
      onCreated(id);
    });
  }

  return (
    <div className="fade-in absolute inset-0 z-50">
      <div className="absolute inset-0 bg-[rgba(40,40,46,.32)]" onClick={onClose} />
      <div className="sheet-in absolute left-1/2 top-1/2 flex w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[18px] border border-line bg-surface p-7 shadow-[0_24px_60px_rgba(40,40,46,.2)]">
        <div className="flex items-start justify-between">
          <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            New client
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
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoFocus
            className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
          />
        </Field>
        <div className="flex gap-3">
          <Field label="Phone" className="flex-1">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(415) 555-0000"
              className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
            />
          </Field>
          <Field label="Email" className="flex-1">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
            />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything we should know?"
            className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
          />
        </Field>

        <div className="mt-1 flex items-center justify-end">
          <div className="flex gap-[9px]">
            <button
              onClick={onClose}
              className="flex h-[42px] items-center justify-center rounded-[11px] border border-line px-5 text-[13px] font-semibold text-ink-faint hover:bg-field"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!name || !phone || pending}
              className={cx(
                "flex h-[42px] items-center justify-center rounded-[11px] bg-brand px-5 text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95",
                (!name || !phone || pending) && "opacity-50",
              )}
            >
              {pending ? "Adding…" : "Add client"}
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
