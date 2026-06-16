"use client";

import { useEffect, useState, useTransition } from "react";
import type { AppointmentDetail, AppointmentStatus } from "@/lib/types";
import type { Slot } from "@/lib/availability";
import { changeAppointmentStatus, fetchSlots, rescheduleAppt } from "@/app/actions";
import { SlotSkeleton } from "@/components/ui/States";
import {
  addDays,
  cx,
  dayOfMonth,
  formatDateLabel,
  formatPriceExact,
  to12h,
  weekdayLabel,
  weekdayOf,
} from "@/lib/utils";

const STATUS_SEGMENTS: { key: AppointmentStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "noshow", label: "No-show" },
];

/**
 * Appointment slide-over. Two modes: detail (status, notes, actions) and an
 * inline reschedule picker that queries real availability for the appointment's
 * service + staff. Closing is delegated to the parent via onClose.
 */
export function AppointmentPanel({
  appointment,
  tenantSlug,
  onClose,
  statusStyles,
}: {
  appointment: AppointmentDetail;
  tenantSlug: string;
  onClose: () => void;
  statusStyles: typeof import("@/lib/utils").STATUS_STYLES;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [rescheduling, setRescheduling] = useState(false);
  const [, startTransition] = useTransition();
  const st = statusStyles[status];

  // Reset local state when the panel switches to a different appointment.
  useEffect(() => {
    setStatus(appointment.status);
    setRescheduling(false);
  }, [appointment.id, appointment.status]);

  function pick(next: AppointmentStatus) {
    setStatus(next);
    startTransition(() => changeAppointmentStatus(appointment.id, next));
  }

  return (
    <div className="fade-in absolute inset-0 z-40">
      <div className="absolute inset-0 bg-[rgba(40,40,46,.22)]" onClick={onClose} />
      <div className="panel-in absolute bottom-0 right-0 top-0 flex w-[432px] flex-col gap-5 overflow-auto border-l border-line bg-surface px-7 py-[26px] shadow-[-14px_0_40px_rgba(40,40,46,.12)]">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-[9px] flex items-center gap-2">
              <span className="size-[9px] rounded-[3px]" style={{ background: st.dot }} />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ color: st.dot }}
              >
                {st.label}
              </span>
            </div>
            <div className="font-display text-[23px] font-semibold tracking-[-0.01em]">
              {appointment.client.name}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-[34px] items-center justify-center rounded-[10px] border border-line text-[17px] text-ink-faint hover:bg-field"
          >
            ×
          </button>
        </div>

        {rescheduling ? (
          <ReschedulePicker
            appointment={appointment}
            tenantSlug={tenantSlug}
            onCancel={() => setRescheduling(false)}
            onDone={onClose}
          />
        ) : (
          <>
            <div className="tnum overflow-hidden rounded-[13px] border border-line-soft">
              <PanelRow label="Service" value={appointment.service.name} />
              <PanelRow label="Staff" value={appointment.staff.name} />
              <PanelRow
                label="When"
                value={`${formatDateLabel(appointment.date)} · ${appointment.startTime}–${appointment.endTime}`}
              />
              <PanelRow label="Duration" value={`${appointment.durationMin} min`} />
              <div className="flex items-center px-4 py-[13px]">
                <span className="w-[92px] text-[12.5px] font-medium text-ink-ghost">Price</span>
                <span className="font-display text-base font-bold">
                  {formatPriceExact(appointment.priceCents)}
                </span>
                <span className="ml-auto rounded-full border border-line px-[10px] py-[3px] text-[11px] font-semibold text-ink-soft">
                  {appointment.payment}
                </span>
              </div>
            </div>

            <div>
              <div className="mb-[9px] text-[12px] font-semibold text-ink-soft">Status</div>
              <div className="flex flex-wrap gap-[7px]">
                {STATUS_SEGMENTS.map((seg) => {
                  const active = status === seg.key;
                  return (
                    <button
                      key={seg.key}
                      onClick={() => pick(seg.key)}
                      className={cx(
                        "rounded-[9px] px-3 py-[7px] text-[12px] font-semibold transition-colors",
                        !active && "border border-line text-ink-faint",
                      )}
                      style={
                        active ? { background: statusStyles[seg.key].dot, color: "#fff" } : undefined
                      }
                    >
                      {seg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-[9px] text-[12px] font-semibold text-ink-soft">Notes</div>
              <div className="min-h-[64px] rounded-[11px] border border-line px-[14px] py-3 text-[12.5px] font-medium leading-[1.5] text-ink-soft">
                {appointment.notes || "No notes yet."}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-[9px]">
              <div className="flex gap-[9px]">
                <button
                  onClick={() => setRescheduling(true)}
                  className="flex h-[42px] flex-1 items-center justify-center rounded-[11px] border border-line text-[13px] font-semibold hover:bg-field"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => pick("cancelled")}
                  className="flex h-[42px] flex-1 items-center justify-center rounded-[11px] border border-line text-[13px] font-semibold text-ink-faint hover:bg-field"
                >
                  Cancel
                </button>
              </div>
              <button
                onClick={onClose}
                className="flex h-[44px] items-center justify-center rounded-[11px] bg-brand text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95"
              >
                Save changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReschedulePicker({
  appointment,
  tenantSlug,
  onCancel,
  onDone,
}: {
  appointment: AppointmentDetail;
  tenantSlug: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  // Offer the 14 days starting from the appointment's current date.
  const dates = Array.from({ length: 14 }, (_, i) => addDays(appointment.date, i));
  const [activeDate, setActiveDate] = useState(appointment.date);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<{ time: string; staffId: string } | null>(null);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Pin to the same staff member so a reschedule keeps the assignment.
    fetchSlots(tenantSlug, appointment.serviceId, activeDate, appointment.staffId).then((res) => {
      if (!cancelled) {
        setSlots(res.all);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, appointment.serviceId, appointment.staffId, activeDate]);

  function confirm() {
    if (!picked) return;
    startSaving(async () => {
      await rescheduleAppt(appointment.id, activeDate, picked.time, picked.staffId);
      onDone();
    });
  }

  return (
    <>
      <div className="text-[13px] font-semibold">
        Reschedule with {appointment.staff.name}
      </div>
      <div className="tnum flex gap-2 overflow-x-auto pb-1">
        {dates.map((d) => {
          const active = d === activeDate;
          const sunday = weekdayOf(d) === 0;
          return (
            <button
              key={d}
              disabled={sunday}
              onClick={() => {
                setActiveDate(d);
                setPicked(null);
              }}
              className={cx(
                "w-[50px] flex-shrink-0 rounded-[12px] py-[9px] text-center",
                active ? "bg-brand text-white" : "border border-line",
                sunday && "opacity-40",
              )}
            >
              <div className={cx("text-[10px] font-semibold", active ? "opacity-80" : "text-ink-ghost")}>
                {weekdayLabel(d).toUpperCase()}
              </div>
              <div className="text-[17px] font-bold">{dayOfMonth(d)}</div>
            </button>
          );
        })}
      </div>

      <div className="min-h-[180px] flex-1">
        {loading ? (
          <SlotSkeleton count={6} />
        ) : slots.length === 0 ? (
          <div className="pt-8 text-center text-[13px] font-medium text-ink-ghost">
            No openings this day — try another date.
          </div>
        ) : (
          <div className="tnum grid grid-cols-3 gap-[9px]">
            {slots.map((s) => {
              const active = picked?.time === s.time;
              return (
                <button
                  key={`${s.time}-${s.staffId}`}
                  onClick={() => setPicked({ time: s.time, staffId: s.staffId })}
                  className={cx(
                    "flex h-11 items-center justify-center rounded-[11px] text-[14px] font-semibold",
                    active ? "bg-brand text-white" : "border border-line text-ink-soft",
                  )}
                >
                  {to12h(s.time).replace(":00", "")}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-[9px]">
        <button
          onClick={confirm}
          disabled={!picked || saving}
          className={cx(
            "flex h-[44px] items-center justify-center rounded-[11px] bg-brand text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95",
            (!picked || saving) && "opacity-40",
          )}
        >
          {saving
            ? "Rescheduling…"
            : picked
              ? `Move to ${formatDateLabel(activeDate)} · ${to12h(picked.time)}`
              : "Pick a new time"}
        </button>
        <button
          onClick={onCancel}
          className="flex h-[42px] items-center justify-center rounded-[11px] border border-line text-[13px] font-semibold text-ink-faint hover:bg-field"
        >
          Back
        </button>
      </div>
    </>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-line-soft px-4 py-[13px]">
      <span className="w-[92px] text-[12.5px] font-medium text-ink-ghost">{label}</span>
      <span className="text-[13.5px] font-semibold">{value}</span>
    </div>
  );
}
