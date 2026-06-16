"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import type { AppointmentDetail, AppointmentStatus, Staff } from "@/lib/types";
import { changeAppointmentStatus } from "@/app/actions";
import {
  cx,
  formatDateLabel,
  formatPriceExact,
  shortNameOf,
  STATUS_STYLES,
  toMinutes,
} from "@/lib/utils";

const DAY_START_MIN = 9 * 60; // 09:00
const HOUR_PX = 56; // matches the design's 56px-per-hour grid
const NOW_MINUTES = 11 * 60 + 24; // demo now-line at 11:24

const STATUS_ORDER: { key: AppointmentStatus; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Done" },
  { key: "noshow", label: "No-show" },
];

const HOURS = Array.from({ length: 9 }, (_, i) => 9 + i); // 09:00–17:00 labels

function topFor(time: string): number {
  return ((toMinutes(time) - DAY_START_MIN) / 60) * HOUR_PX;
}
function heightFor(durationMin: number): number {
  return (durationMin / 60) * HOUR_PX;
}

interface Props {
  dateIso: string;
  staff: Staff[];
  appointments: AppointmentDetail[];
}

export function CalendarDayView({ dateIso, staff, appointments }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("appt");
  const open = useMemo(
    () => appointments.find((a) => a.id === openId) ?? null,
    [appointments, openId],
  );

  const byStaff = useMemo(() => {
    const map = new Map<string, AppointmentDetail[]>();
    for (const s of staff) map.set(s.id, []);
    for (const a of appointments) map.get(a.staffId)?.push(a);
    return map;
  }, [staff, appointments]);

  const setOpen = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("appt", id);
      else params.delete("appt");
      router.replace(`/operator/calendar${params.toString() ? `?${params}` : ""}`, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const nowTop = ((NOW_MINUTES - DAY_START_MIN) / 60) * HOUR_PX;

  return (
    <div className="fade-in px-7 pb-10 pt-[22px]">
      {/* controls */}
      <div className="mb-[18px] flex items-center justify-between">
        <div className="flex items-center gap-[14px]">
          <div className="flex overflow-hidden rounded-[10px] border border-line bg-surface text-[13px] font-semibold">
            <span className="bg-brand px-[15px] py-2 text-white">Day</span>
            <span className="cursor-default border-l border-line px-[15px] py-2 text-ink-faint">
              Week
            </span>
          </div>
          <div className="flex items-center gap-[9px]">
            <span className="flex size-8 items-center justify-center rounded-[9px] border border-line bg-surface text-ink-faint">
              ‹
            </span>
            <span className="tnum font-display text-base font-semibold">
              {formatDateLabel(dateIso)}
            </span>
            <span className="flex size-8 items-center justify-center rounded-[9px] border border-line bg-surface text-ink-faint">
              ›
            </span>
          </div>
        </div>
        <div className="flex items-center gap-[7px] text-[12px] font-medium text-ink-faint">
          {STATUS_ORDER.map((s) => (
            <span key={s.key} className="ml-1.5 flex items-center gap-1.5 first:ml-0">
              <span
                className="size-[9px] rounded-[3px]"
                style={{ background: STATUS_STYLES[s.key].rail }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* grid card */}
      <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
        {/* staff headers */}
        <div className="flex border-b border-line pl-[56px]">
          {staff.map((s) => (
            <div
              key={s.id}
              className="flex flex-1 items-center gap-[9px] border-l border-line-soft px-[14px] py-[13px]"
            >
              <span className="size-[26px] rounded-full" style={{ background: s.avatarColor }} />
              <div className="leading-[1.2]">
                <div className="text-[13px] font-semibold">{s.shortName}</div>
                <div className="text-[10px] font-medium text-ink-ghost">{s.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* grid body */}
        <div className="relative flex h-[504px] overflow-hidden">
          {/* hour gutter */}
          <div className="tnum w-[56px] flex-shrink-0">
            {HOURS.map((h) => (
              <div key={h} className="h-[56px] pr-[9px] text-right">
                <span className="relative top-[-7px] text-[11px] font-medium text-ink-ghost">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* columns */}
          <div
            className="relative flex flex-1"
            style={{
              background:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 55px, #f3f1f4 55px, #f3f1f4 56px)",
            }}
          >
            {/* now-line spanning all columns */}
            <div
              className="now-dot pointer-events-none absolute left-0 right-0 z-[9] h-0.5 bg-brand"
              style={{ top: nowTop }}
            >
              <span className="absolute -left-1 -top-1 size-[9px] rounded-full bg-brand" />
              <span className="tnum absolute -left-[52px] -top-[9px] text-[11px] font-bold text-brand">
                11:24
              </span>
            </div>

            {staff.map((s) => (
              <div
                key={s.id}
                className="relative flex-1 cursor-pointer border-l border-line-soft"
                onClick={() => router.push("/operator/calendar?new=1")}
              >
                {(byStaff.get(s.id) ?? []).map((a) => {
                  const st = STATUS_STYLES[a.status];
                  const isNoShow = a.status === "noshow";
                  return (
                    <button
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(a.id);
                      }}
                      className="absolute left-1 right-1 overflow-hidden rounded-[9px] border px-[9px] py-[5px] text-left transition-[box-shadow,filter] hover:shadow-[0_2px_8px_rgba(40,40,46,.08)] hover:brightness-[.98]"
                      style={{
                        top: topFor(a.startTime),
                        height: heightFor(a.durationMin),
                        background: isNoShow
                          ? "repeating-linear-gradient(45deg, #f0ddd8 0 6px, #f7ebe7 6px 12px)"
                          : st.bg,
                        borderColor: `${st.rail}44`,
                        borderLeft: `3px solid ${st.rail}`,
                      }}
                    >
                      <div
                        className="tnum overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-bold"
                        style={{
                          color: st.title,
                          textDecoration: a.status === "cancelled" ? "line-through" : "none",
                        }}
                      >
                        {a.startTime} · {shortNameOf(a.client.name)}
                      </div>
                      <div
                        className="overflow-hidden text-ellipsis whitespace-nowrap text-[10.5px] font-medium"
                        style={{ color: st.sub }}
                      >
                        {a.service.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 text-center text-[12px] font-medium text-ink-ghost">
        Click an appointment to open it · click an empty slot to book
      </div>

      {open && <AppointmentPanel appointment={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function AppointmentPanel({
  appointment,
  onClose,
}: {
  appointment: AppointmentDetail;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [, startTransition] = useTransition();
  const st = STATUS_STYLES[status];

  const segments: { key: AppointmentStatus; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Completed" },
    { key: "noshow", label: "No-show" },
  ];

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

        <div className="tnum overflow-hidden rounded-[13px] border border-line-soft">
          <PanelRow label="Service" value={appointment.service.name} />
          <PanelRow label="Staff" value={appointment.staff.name} />
          <PanelRow label="When" value={`${formatDateLabel(appointment.date)} · ${appointment.startTime}–${appointment.endTime}`} />
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
            {segments.map((seg) => {
              const active = status === seg.key;
              return (
                <button
                  key={seg.key}
                  onClick={() => pick(seg.key)}
                  className={cx(
                    "rounded-[9px] px-3 py-[7px] text-[12px] font-semibold transition-colors",
                    !active && "border border-line text-ink-faint",
                  )}
                  style={active ? { background: STATUS_STYLES[seg.key].dot, color: "#fff" } : undefined}
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
            <button className="flex h-[42px] flex-1 items-center justify-center rounded-[11px] border border-line text-[13px] font-semibold hover:bg-field">
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
      </div>
    </div>
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
