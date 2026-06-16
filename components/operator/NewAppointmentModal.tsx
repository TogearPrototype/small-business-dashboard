"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Service, Staff } from "@/lib/types";
import { submitBooking } from "@/app/actions";
import { formatPrice, cx } from "@/lib/utils";

/**
 * Operator-side quick booking. A lightweight form (service → staff → time →
 * client) that writes a pending appointment via the submitBooking action.
 * The public booking flow (components/booking) is the richer, guided version.
 */
export function NewAppointmentModal({
  dateIso,
  staff,
  services,
  prefillClient,
}: {
  dateIso: string;
  staff: Staff[];
  services: Service[];
  /** Optional client name to prefill (e.g. when launched from a client profile). */
  prefillClient?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const eligibleStaff = useMemo(
    () => staff.filter((s) => s.serviceIds.includes(serviceId)),
    [staff, serviceId],
  );
  const [staffId, setStaffId] = useState(eligibleStaff[0]?.id ?? staff[0]?.id ?? "");
  const [startTime, setStartTime] = useState("10:30");
  const [clientName, setClientName] = useState(prefillClient ?? "");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");

  const service = services.find((s) => s.id === serviceId);

  function close() {
    router.push("/operator/calendar");
  }

  function save() {
    if (!clientName || !clientPhone) return;
    const effectiveStaff = eligibleStaff.some((s) => s.id === staffId)
      ? staffId
      : eligibleStaff[0]?.id ?? staffId;
    startTransition(async () => {
      await submitBooking({
        serviceId,
        staffId: effectiveStaff,
        date: dateIso,
        startTime,
        clientName,
        clientPhone,
        clientEmail,
        notes,
      });
      router.push("/operator/calendar");
    });
  }

  return (
    <div className="fade-in absolute inset-0 z-50">
      <div className="absolute inset-0 bg-[rgba(40,40,46,.32)]" onClick={close} />
      <div className="sheet-in absolute left-1/2 top-1/2 flex w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[18px] border border-line bg-surface p-7 shadow-[0_24px_60px_rgba(40,40,46,.2)]">
        <div className="flex items-start justify-between">
          <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">
            New appointment
          </div>
          <button
            onClick={close}
            className="flex size-[34px] items-center justify-center rounded-[10px] border border-line text-[17px] text-ink-faint hover:bg-field"
          >
            ×
          </button>
        </div>

        <Field label="Service">
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="h-[42px] w-full rounded-[10px] border border-line bg-field px-3 text-[13.5px] font-medium"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMin}m · {formatPrice(s.priceCents)}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3">
          <Field label="Staff" className="flex-1">
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="h-[42px] w-full rounded-[10px] border border-line bg-field px-3 text-[13.5px] font-medium"
            >
              {eligibleStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start time" className="w-[140px]">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="tnum h-[42px] w-full rounded-[10px] border border-line bg-field px-3 text-[13.5px] font-medium"
            />
          </Field>
        </div>

        <Field label="Client name">
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Full name"
            className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
          />
        </Field>
        <div className="flex gap-3">
          <Field label="Phone" className="flex-1">
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="(415) 555-0000"
              className="h-[42px] w-full rounded-[10px] border border-line px-3 text-[13.5px] font-medium"
            />
          </Field>
          <Field label="Email" className="flex-1">
            <input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
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

        <div className="mt-1 flex items-center justify-between">
          <div className="text-[12.5px] font-medium text-ink-faint">
            {service && `${service.durationMin} min · ${formatPrice(service.priceCents)}`}
          </div>
          <div className="flex gap-[9px]">
            <button
              onClick={close}
              className="flex h-[42px] items-center justify-center rounded-[11px] border border-line px-5 text-[13px] font-semibold text-ink-faint hover:bg-field"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!clientName || !clientPhone || pending}
              className={cx(
                "flex h-[42px] items-center justify-center rounded-[11px] bg-brand px-5 text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95",
                (!clientName || !clientPhone || pending) && "opacity-50",
              )}
            >
              {pending ? "Booking…" : "Book appointment"}
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
