"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

/**
 * "My bookings" experience — the public, no-account way for a customer to look
 * up a booking by reference and then view / reschedule / cancel it. Rendered
 * inside the site shell's centered <main>, so it brings no header/footer of its
 * own. Drives both /book/[slug]/appointments and /book/[slug]/manage.
 *
 * When `initial` is undefined it shows the lookup form (with `notFound` styling
 * when a ref was tried and missed). When `initial` is present it shows the
 * booking card with actions.
 */
export function MyAppointments({
  tenant,
  bookingRef,
  initial,
  notFound,
}: {
  tenant: Tenant;
  bookingRef?: string;
  initial?: AppointmentDetail;
  notFound?: boolean;
}) {
  return (
    <div className="fade-in py-10">
      <header className="mb-8">
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.01em]">My bookings</h1>
        <p className="mt-2 max-w-[560px] text-[14px] font-medium leading-[1.55] text-ink-faint">
          Look up an existing booking by its reference to view, reschedule, or cancel it. You
          don&apos;t need an account.
        </p>
      </header>

      {initial && bookingRef ? (
        <BookingPanel tenant={tenant} bookingRef={bookingRef} initial={initial} />
      ) : (
        <LookupPanel tenant={tenant} notFound={notFound} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- lookup --- */

function LookupPanel({ tenant, notFound }: { tenant: Tenant; notFound?: boolean }) {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const sample = `${tenant.slug.slice(0, 3).toUpperCase()}-0012`;

  function go() {
    if (!ref.trim()) return;
    router.push(`/book/${tenant.slug}/appointments?ref=${encodeURIComponent(ref.trim())}`);
  }

  return (
    <div className="max-w-[460px] rounded-[16px] border border-line bg-surface p-6 sm:p-7">
      <div className="font-display text-[18px] font-semibold tracking-[-0.01em]">
        Find your booking
      </div>
      <p className="mb-5 mt-1 text-[13px] font-medium leading-[1.5] text-ink-faint">
        Enter the booking reference from your confirmation (e.g. {sample}).
      </p>

      {notFound && (
        <div
          className="mb-4 rounded-[11px] px-4 py-3 text-[12.5px] font-medium leading-[1.5]"
          style={{ background: STATUS_STYLES.noshow.bg, color: STATUS_STYLES.noshow.title }}
        >
          We couldn&apos;t find a booking with that reference. Check it and try again.
        </div>
      )}

      <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-ghost">
        Booking reference
      </label>
      <input
        value={ref}
        onChange={(e) => setRef(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder={sample}
        autoFocus
        className="tnum mb-4 h-[48px] w-full rounded-[12px] border border-line bg-field px-4 text-[15px] font-semibold tracking-[0.04em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
      <button
        onClick={go}
        disabled={!ref.trim()}
        className={cx(
          "flex h-[48px] w-full items-center justify-center rounded-[12px] bg-brand text-[14px] font-bold text-white transition-[filter] hover:brightness-95",
          !ref.trim() && "opacity-40",
        )}
      >
        Find my booking
      </button>

      <div className="mt-5 border-t border-line-soft pt-4 text-[12.5px] font-medium text-ink-faint">
        Don&apos;t have a booking yet?{" "}
        <Link href={`/book/${tenant.slug}/book`} className="font-semibold text-brand">
          Book an appointment
        </Link>
        .
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- booking --- */

type Mode = "view" | "reschedule" | "cancelled";

function BookingPanel({
  tenant,
  bookingRef,
  initial,
}: {
  tenant: Tenant;
  bookingRef: string;
  initial: AppointmentDetail;
}) {
  const [appt, setAppt] = useState(initial);
  const [mode, setMode] = useState<Mode>(initial.status === "cancelled" ? "cancelled" : "view");
  const st = STATUS_STYLES[appt.status];

  return (
    <div className="max-w-[520px]">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href={`/book/${tenant.slug}/appointments`}
          className="text-[13px] font-semibold text-ink-faint transition-colors hover:text-brand"
        >
          ← All bookings
        </Link>
        <span className="tnum ml-auto text-[12px] font-semibold text-ink-ghost">{bookingRef}</span>
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
        <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
          <div className="flex items-center gap-[7px] px-[20px] pb-3 pt-[18px]">
            <span className="size-2 rounded-[2px]" style={{ background: st.dot }} />
            <span
              className="text-[11.5px] font-bold uppercase tracking-[0.08em]"
              style={{ color: st.dot }}
            >
              {st.label}
            </span>
          </div>

          <div className="tnum border-b border-line-soft px-[20px] pb-[18px]">
            <div className="font-display text-[20px] font-bold tracking-[-0.01em]">
              {appt.service.name}
            </div>
            <div className="text-[13px] font-medium text-ink-faint">with {appt.staff.name}</div>
          </div>

          <Row label="When" value={`${formatDateLabel(appt.date)} · ${to12h(appt.startTime)}`} />
          <Row label="Where" value={tenant.address} />
          <div className="flex items-center px-[20px] py-[14px]">
            <span className="w-[84px] text-[12.5px] font-medium text-ink-ghost">Total</span>
            <span className="font-display tnum text-[16px] font-bold">
              {formatPriceExact(appt.priceCents)}
            </span>
          </div>

          <div className="border-t border-line-soft px-[20px] py-[18px]">
            {mode === "cancelled" ? (
              <div className="rounded-[12px] bg-field px-4 py-[14px] text-[12.5px] font-medium leading-[1.5] text-ink-soft">
                This booking has been cancelled. Need another time?{" "}
                <Link href={`/book/${tenant.slug}/book`} className="font-semibold text-brand">
                  Book again
                </Link>
                .
              </div>
            ) : (
              <BookingActions
                tenant={tenant}
                bookingRef={bookingRef}
                onReschedule={() => setMode("reschedule")}
                onCancelled={() => {
                  setAppt({ ...appt, status: "cancelled" });
                  setMode("cancelled");
                }}
              />
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 text-[12.5px] font-semibold">
        <Link href={`/book/${tenant.slug}`} className="text-ink-faint transition-colors hover:text-brand">
          Back to home
        </Link>
        <span className="text-ink-ghost">·</span>
        <Link href={`/book/${tenant.slug}/book`} className="text-brand">
          Book another
        </Link>
      </div>
    </div>
  );
}

function BookingActions({
  tenant,
  bookingRef,
  onReschedule,
  onCancelled,
}: {
  tenant: Tenant;
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
      <div className="flex flex-col gap-[10px] sm:flex-row">
        <button
          onClick={onReschedule}
          className="flex h-12 flex-1 items-center justify-center rounded-[12px] bg-brand text-[14px] font-bold text-white transition-[filter] hover:brightness-95"
        >
          Reschedule
        </button>
        {!confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="flex h-12 flex-1 items-center justify-center rounded-[12px] border border-line text-[14px] font-semibold text-ink-faint hover:bg-field"
          >
            Cancel booking
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-[10px] flex flex-col gap-[10px] rounded-[12px] border border-line p-3">
          <div className="text-center text-[12.5px] font-medium text-ink-soft">
            Cancel this booking? This can&apos;t be undone.
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
      )}

      <div className="mt-4 rounded-[12px] bg-field px-4 py-[14px] text-[12px] font-medium leading-[1.5] text-ink-faint">
        Free to change up to{" "}
        <span className="font-bold text-ink-soft">{tenant.cancellationWindowHours}h before</span>{" "}
        your appointment. After that a fee may apply.
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
    <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
      <div className="px-[20px] pb-3 pt-[18px]">
        <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">
          Pick a new time
        </div>
        <div className="text-[12.5px] font-medium text-ink-faint">
          {appt.service.name} · {appt.staff.name}
        </div>
      </div>
      <div className="tnum flex gap-2 overflow-x-auto px-[20px] pb-3">
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
      <div className="max-h-[260px] overflow-auto px-[20px]">
        {loading ? (
          <SlotSkeleton count={9} />
        ) : slots.length === 0 ? (
          <div className="py-8 text-center text-[13px] font-medium text-ink-ghost">
            No openings this day — try another date.
          </div>
        ) : (
          <div className="tnum grid grid-cols-3 gap-[9px] sm:grid-cols-4">
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
      <div className="flex flex-col gap-[9px] border-t border-line-soft px-[20px] pb-5 pt-4 sm:flex-row-reverse">
        <button
          onClick={confirm}
          disabled={!picked || saving}
          className={cx(
            "flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-brand text-[15px] font-bold text-white transition-[filter] hover:brightness-95",
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
          className="flex h-[48px] items-center justify-center rounded-[12px] border border-line px-5 text-[13px] font-semibold text-ink-faint hover:bg-field sm:flex-none"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-line-soft px-[20px] py-[14px]">
      <span className="w-[84px] flex-shrink-0 text-[12.5px] font-medium text-ink-ghost">{label}</span>
      <span className="text-[13.5px] font-semibold leading-[1.4]">{value}</span>
    </div>
  );
}
