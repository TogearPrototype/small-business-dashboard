"use client";

import { useEffect, useState, useTransition } from "react";
import type { AppointmentDetail, Tenant } from "@/lib/types";
import type { Slot } from "@/lib/availability";
import { cancelByRef, fetchSlots, rescheduleByRef } from "@/app/actions";
import { SlotSkeleton } from "@/components/ui/States";
import {
  addDays,
  cx,
  dayOfMonth,
  formatDateLabel,
  formatPriceExact,
  STATUS_STYLES,
  to12h,
  weekdayLabel,
  weekdayOf,
} from "@/lib/utils";

type Mode = "view" | "reschedule" | "cancelled";

/**
 * Public, no-account "manage your booking" screen — reached from the
 * confirmation screen or a reminder link via ?ref=<bookingRef>. Lets a client
 * reschedule (same staff) or cancel within the tenant's cancellation window.
 */
export function ManageBooking({
  tenant,
  bookingRef,
  initial,
}: {
  tenant: Tenant;
  bookingRef: string;
  initial: AppointmentDetail;
}) {
  const [appt, setAppt] = useState(initial);
  const [mode, setMode] = useState<Mode>(
    initial.status === "cancelled" ? "cancelled" : "view",
  );
  const st = STATUS_STYLES[appt.status];

  return (
    <div className="flex min-h-screen items-center justify-center p-0 sm:p-6">
      <div className="flex min-h-screen w-full flex-col overflow-hidden bg-surface sm:min-h-0 sm:h-[760px] sm:w-[390px] sm:rounded-[34px] sm:border sm:border-line sm:shadow-[0_6px_22px_rgba(0,0,0,.09)]">
        <div className="flex h-[42px] flex-shrink-0 items-center justify-between px-6 text-[13px] font-bold">
          <span className="tnum">9:41</span>
          <span className="h-[10px] w-[18px] rounded-[2px] border-[1.5px] border-ink" />
        </div>
        <div className="flex items-center gap-[9px] border-b border-line-soft px-[22px] py-[14px]">
          <span className="flex size-6 items-center justify-center rounded-[7px] bg-brand text-[12px] font-bold text-white">
            {tenant.logoMark}
          </span>
          <span className="text-[14px] font-bold">Your booking</span>
          <span className="tnum ml-auto text-[11px] font-semibold text-ink-ghost">{bookingRef}</span>
        </div>

        {mode === "reschedule" ? (
          <RescheduleView
            tenant={tenant}
            appt={appt}
            bookingRef={bookingRef}
            onCancel={() => setMode("view")}
            onDone={(updated) => {
              setAppt(updated);
              setMode("view");
            }}
          />
        ) : (
          <div className="flex flex-1 flex-col px-[22px] pt-6">
            <div className="mb-4 flex items-center gap-[7px]">
              <span className="size-2 rounded-[2px]" style={{ background: st.dot }} />
              <span
                className="text-[11.5px] font-bold uppercase tracking-[0.08em]"
                style={{ color: st.dot }}
              >
                {st.label}
              </span>
            </div>

            <div className="tnum mb-5 overflow-hidden rounded-[16px] border border-line">
              <div className="border-b border-line-soft px-[18px] py-4">
                <div className="font-display text-[18px] font-bold">{appt.service.name}</div>
                <div className="text-[12.5px] font-medium text-ink-faint">with {appt.staff.name}</div>
              </div>
              <Row label="When" value={`${formatDateLabel(appt.date)} · ${to12h(appt.startTime)}`} />
              <div className="flex px-[18px] py-[13px]">
                <span className="w-[76px] text-[12.5px] font-medium text-ink-ghost">Total</span>
                <span className="font-display text-[15px] font-bold">
                  {formatPriceExact(appt.priceCents)}
                </span>
              </div>
            </div>

            {mode === "cancelled" ? (
              <div className="rounded-[12px] bg-field px-4 py-[14px] text-[12.5px] font-medium leading-[1.5] text-ink-soft">
                This booking has been cancelled. Need another time?{" "}
                <a href={`/book/${tenant.slug}`} className="font-semibold text-brand">
                  Book again
                </a>
                .
              </div>
            ) : (
              <BookingActions
                tenant={tenant}
                appt={appt}
                bookingRef={bookingRef}
                onReschedule={() => setMode("reschedule")}
                onCancelled={() => {
                  setAppt({ ...appt, status: "cancelled" });
                  setMode("cancelled");
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingActions({
  tenant,
  appt,
  bookingRef,
  onReschedule,
  onCancelled,
}: {
  tenant: Tenant;
  appt: AppointmentDetail;
  bookingRef: string;
  onReschedule: () => void;
  onCancelled: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function doCancel() {
    startTransition(async () => {
      const res = await cancelByRef(bookingRef);
      if (res.ok) onCancelled();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-[10px]">
        <button
          onClick={onReschedule}
          className="flex h-12 items-center justify-center rounded-[12px] bg-brand text-[14px] font-bold text-white transition-[filter] hover:brightness-95"
        >
          Reschedule
        </button>
        {confirming ? (
          <div className="flex flex-col gap-[10px] rounded-[12px] border border-line p-3">
            <div className="text-center text-[12.5px] font-medium text-ink-soft">
              Cancel this booking? This can’t be undone.
            </div>
            <div className="flex gap-[9px]">
              <button
                onClick={() => setConfirming(false)}
                className="h-10 flex-1 rounded-[10px] border border-line text-[13px] font-semibold text-ink-faint hover:bg-field"
              >
                Keep it
              </button>
              <button
                onClick={doCancel}
                disabled={pending}
                className="h-10 flex-1 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-50"
                style={{ background: STATUS_STYLES.noshow.dot }}
              >
                {pending ? "Cancelling…" : "Cancel booking"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="flex h-12 items-center justify-center rounded-[12px] border border-line text-[14px] font-semibold text-ink-faint hover:bg-field"
          >
            Cancel booking
          </button>
        )}
      </div>

      <div className="mt-auto pb-[26px] pt-5">
        <div className="rounded-[12px] bg-field px-4 py-[14px] text-[12px] font-medium leading-[1.5] text-ink-faint">
          Free to change up to{" "}
          <span className="font-bold text-ink-soft">
            {tenant.cancellationWindowHours}h before
          </span>{" "}
          your appointment. After that a fee may apply.
        </div>
      </div>
    </>
  );
}

function RescheduleView({
  tenant,
  appt,
  bookingRef,
  onCancel,
  onDone,
}: {
  tenant: Tenant;
  appt: AppointmentDetail;
  bookingRef: string;
  onCancel: () => void;
  onDone: (updated: AppointmentDetail) => void;
}) {
  const dates = Array.from({ length: 14 }, (_, i) => addDays(appt.date, i));
  const [activeDate, setActiveDate] = useState(appt.date);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<{ time: string; staffId: string } | null>(null);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSlots(tenant.slug, appt.serviceId, activeDate, appt.staffId).then((res) => {
      if (!cancelled) {
        setSlots(res.all);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tenant.slug, appt.serviceId, appt.staffId, activeDate]);

  function confirm() {
    if (!picked) return;
    startSaving(async () => {
      const res = await rescheduleByRef(bookingRef, activeDate, picked.time, picked.staffId);
      if (res.ok) {
        onDone({ ...appt, date: activeDate, startTime: picked.time });
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-[22px] pb-3 pt-5">
        <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">
          Pick a new time
        </div>
        <div className="text-[12.5px] font-medium text-ink-faint">
          {appt.service.name} · {appt.staff.name}
        </div>
      </div>
      <div className="tnum flex gap-2 overflow-x-auto px-[22px] pb-3">
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
      <div className="flex-1 overflow-auto px-[22px]">
        {loading ? (
          <SlotSkeleton count={9} />
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
      <div className="flex flex-col gap-[9px] border-t border-line-soft px-[22px] pb-6 pt-4">
        <button
          onClick={confirm}
          disabled={!picked || saving}
          className={cx(
            "flex h-[50px] items-center justify-center rounded-[13px] bg-brand text-[15px] font-bold text-white transition-[filter] hover:brightness-95",
            (!picked || saving) && "opacity-40",
          )}
        >
          {saving
            ? "Saving…"
            : picked
              ? `Confirm · ${formatDateLabel(activeDate)} ${to12h(picked.time)}`
              : "Pick a time"}
        </button>
        <button
          onClick={onCancel}
          className="flex h-[42px] items-center justify-center rounded-[12px] border border-line text-[13px] font-semibold text-ink-faint hover:bg-field"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-line-soft px-[18px] py-[13px]">
      <span className="w-[76px] text-[12.5px] font-medium text-ink-ghost">{label}</span>
      <span className="text-[13.5px] font-semibold">{value}</span>
    </div>
  );
}
