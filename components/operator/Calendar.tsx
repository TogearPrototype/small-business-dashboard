"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { AppointmentDetail, Staff } from "@/lib/types";
import { AppointmentPanel } from "./AppointmentPanel";
import { EmptyState } from "@/components/ui/States";
import {
  addDays,
  cx,
  dayOfMonth,
  formatDateLabel,
  formatWeekRange,
  shortNameOf,
  STATUS_STYLES,
  toMinutes,
  weekDates,
  weekdayLabel,
} from "@/lib/utils";

const DAY_START_MIN = 9 * 60; // 09:00
const DAY_END_MIN = 18 * 60; // 18:00
const HOUR_PX = 56; // 56px per hour, matching the design
const GRID_HEIGHT = ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_PX; // 504
const HOURS = Array.from({ length: 9 }, (_, i) => 9 + i); // 09:00–17:00 labels

const LEGEND = [
  { key: "confirmed", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Done" },
  { key: "noshow", label: "No-show" },
] as const;

type View = "day" | "week";

function topFor(time: string): number {
  return ((toMinutes(time) - DAY_START_MIN) / 60) * HOUR_PX;
}
function heightFor(durationMin: number): number {
  return (durationMin / 60) * HOUR_PX;
}

interface Props {
  dateIso: string;
  view: View;
  staff: Staff[];
  /** All appointments for the visible range (day: that date; week: Mon–Sun). */
  appointments: AppointmentDetail[];
  tenantSlug: string;
  /** The demo "today" + clock — the only day that shows a now-line. */
  demoDate: string;
  demoNowMinutes: number;
}

export function Calendar({
  dateIso,
  view,
  staff,
  appointments,
  tenantSlug,
  demoDate,
  demoNowMinutes,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("appt");
  const open = useMemo(
    () => appointments.find((a) => a.id === openId) ?? null,
    [appointments, openId],
  );

  const navigate = useCallback(
    (patch: { date?: string; view?: View; appt?: string | null; new?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.date !== undefined) params.set("date", patch.date);
      if (patch.view !== undefined) params.set("view", patch.view);
      if (patch.appt !== undefined) {
        if (patch.appt) params.set("appt", patch.appt);
        else params.delete("appt");
      }
      if (patch.new) params.set("new", "1");
      router.replace(`/operator/calendar?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const step = view === "day" ? 1 : 7;

  return (
    <div className="fade-in px-7 pb-10 pt-[22px]">
      {/* controls */}
      <div className="mb-[18px] flex items-center justify-between">
        <div className="flex items-center gap-[14px]">
          <div className="flex overflow-hidden rounded-[10px] border border-line bg-surface text-[13px] font-semibold">
            <button
              onClick={() => navigate({ view: "day" })}
              className={cx("px-[15px] py-2", view === "day" ? "bg-brand text-white" : "text-ink-faint")}
            >
              Day
            </button>
            <button
              onClick={() => navigate({ view: "week" })}
              className={cx(
                "border-l border-line px-[15px] py-2",
                view === "week" ? "bg-brand text-white" : "text-ink-faint",
              )}
            >
              Week
            </button>
          </div>
          <div className="flex items-center gap-[9px]">
            <button
              onClick={() => navigate({ date: addDays(dateIso, -step), appt: null })}
              className="flex size-8 items-center justify-center rounded-[9px] border border-line bg-surface text-ink-faint hover:bg-field"
              aria-label="Previous"
            >
              ‹
            </button>
            <span className="tnum min-w-[120px] text-center font-display text-base font-semibold">
              {view === "day" ? formatDateLabel(dateIso) : formatWeekRange(dateIso)}
            </span>
            <button
              onClick={() => navigate({ date: addDays(dateIso, step), appt: null })}
              className="flex size-8 items-center justify-center rounded-[9px] border border-line bg-surface text-ink-faint hover:bg-field"
              aria-label="Next"
            >
              ›
            </button>
            <button
              onClick={() => navigate({ date: demoDate, appt: null })}
              className="px-1 text-[13px] font-semibold text-ink-faint hover:text-brand"
            >
              Today
            </button>
          </div>
        </div>
        <div className="flex items-center gap-[7px] text-[12px] font-medium text-ink-faint">
          {LEGEND.map((s) => (
            <span key={s.key} className="ml-1.5 flex items-center gap-1.5 first:ml-0">
              <span className="size-[9px] rounded-[3px]" style={{ background: STATUS_STYLES[s.key].rail }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {view === "day" ? (
        <DayGrid
          dateIso={dateIso}
          staff={staff}
          appointments={appointments}
          demoDate={demoDate}
          demoNowMinutes={demoNowMinutes}
          onOpen={(id) => navigate({ appt: id })}
          onNew={() => navigate({ new: true })}
        />
      ) : (
        <WeekGrid
          dateIso={dateIso}
          appointments={appointments}
          demoDate={demoDate}
          demoNowMinutes={demoNowMinutes}
          onOpen={(id) => navigate({ appt: id })}
          onDayClick={(d) => navigate({ date: d, view: "day", appt: null })}
        />
      )}

      <div className="mt-3 text-center text-[12px] font-medium text-ink-ghost">
        Click an appointment to open it · click an empty slot to book
      </div>

      {open && (
        <AppointmentPanel
          appointment={open}
          tenantSlug={tenantSlug}
          statusStyles={STATUS_STYLES}
          onClose={() => navigate({ appt: null })}
        />
      )}
    </div>
  );
}

// ---- Day view: column per staff ----

function DayGrid({
  dateIso,
  staff,
  appointments,
  demoDate,
  demoNowMinutes,
  onOpen,
  onNew,
}: {
  dateIso: string;
  staff: Staff[];
  appointments: AppointmentDetail[];
  demoDate: string;
  demoNowMinutes: number;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const dayAppts = useMemo(
    () => appointments.filter((a) => a.date === dateIso),
    [appointments, dateIso],
  );
  const byStaff = useMemo(() => {
    const map = new Map<string, AppointmentDetail[]>();
    for (const s of staff) map.set(s.id, []);
    for (const a of dayAppts) map.get(a.staffId)?.push(a);
    return map;
  }, [staff, dayAppts]);

  const showNow = dateIso === demoDate;
  const nowTop = ((demoNowMinutes - DAY_START_MIN) / 60) * HOUR_PX;

  if (dayAppts.length === 0) {
    return (
      <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
        <EmptyState
          title="Nothing booked this day"
          body="A clear day. Click any empty column to add an appointment, or share your booking link."
          actions={[{ label: "+ New appointment", onClick: onNew }]}
          className="py-16"
        />
      </div>
    );
  }

  return (
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

      <div className="relative flex overflow-hidden" style={{ height: GRID_HEIGHT }}>
        <div className="tnum w-[56px] flex-shrink-0">
          {HOURS.map((h) => (
            <div key={h} className="h-[56px] pr-[9px] text-right">
              <span className="relative top-[-7px] text-[11px] font-medium text-ink-ghost">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        <div
          className="relative flex flex-1"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 55px, #f3f1f4 55px, #f3f1f4 56px)",
          }}
        >
          {showNow && (
            <div className="now-dot pointer-events-none absolute left-0 right-0 z-[9] h-0.5 bg-brand" style={{ top: nowTop }}>
              <span className="absolute -left-1 -top-1 size-[9px] rounded-full bg-brand" />
              <span className="tnum absolute -left-[52px] -top-[9px] text-[11px] font-bold text-brand">
                {String(Math.floor(demoNowMinutes / 60)).padStart(2, "0")}:
                {String(demoNowMinutes % 60).padStart(2, "0")}
              </span>
            </div>
          )}

          {staff.map((s) => (
            <div
              key={s.id}
              className="relative flex-1 cursor-pointer border-l border-line-soft"
              onClick={onNew}
            >
              {(byStaff.get(s.id) ?? []).map((a) => {
                const st = STATUS_STYLES[a.status];
                const isNoShow = a.status === "noshow";
                return (
                  <button
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(a.id);
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
  );
}

// ---- Week view: column per day ----

function WeekGrid({
  dateIso,
  appointments,
  demoDate,
  demoNowMinutes,
  onOpen,
  onDayClick,
}: {
  dateIso: string;
  appointments: AppointmentDetail[];
  demoDate: string;
  demoNowMinutes: number;
  onOpen: (id: string) => void;
  onDayClick: (date: string) => void;
}) {
  const days = useMemo(() => weekDates(dateIso), [dateIso]);
  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentDetail[]>();
    for (const d of days) map.set(d, []);
    for (const a of appointments) map.get(a.date)?.push(a);
    return map;
  }, [days, appointments]);

  const nowTop = ((demoNowMinutes - DAY_START_MIN) / 60) * HOUR_PX;

  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
      {/* day headers */}
      <div className="flex border-b border-line pl-[52px]">
        {days.map((d) => {
          const isToday = d === demoDate;
          return (
            <button
              key={d}
              onClick={() => onDayClick(d)}
              className="flex-1 border-l border-line-soft py-[10px] text-center hover:bg-field"
            >
              <div className="text-[11px] font-medium uppercase text-ink-ghost">{weekdayLabel(d)}</div>
              <div
                className={cx("tnum text-base font-bold", isToday && "text-brand")}
                style={{ color: weekdayLabel(d) === "Sun" && !isToday ? "#c4c4c8" : undefined }}
              >
                {dayOfMonth(d)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative flex overflow-hidden" style={{ height: GRID_HEIGHT }}>
        <div className="tnum w-[52px] flex-shrink-0">
          {HOURS.map((h) => (
            <div key={h} className="h-[56px] pr-2 text-right">
              <span className="relative top-[-7px] text-[11px] font-medium text-ink-ghost">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        <div
          className="relative flex flex-1"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 55px, #f3f1f4 55px, #f3f1f4 56px)",
          }}
        >
          {days.map((d) => {
            const isToday = d === demoDate;
            return (
              <div key={d} className="relative flex-1 border-l border-line-soft">
                {isToday && (
                  <div className="now-dot pointer-events-none absolute left-0 right-0 z-[9] h-0.5 bg-brand" style={{ top: nowTop }}>
                    <span className="absolute -left-1 -top-1 size-[9px] rounded-full bg-brand" />
                  </div>
                )}
                {(byDay.get(d) ?? []).map((a) => {
                  const st = STATUS_STYLES[a.status];
                  const isNoShow = a.status === "noshow";
                  return (
                    <button
                      key={a.id}
                      onClick={() => onOpen(a.id)}
                      className="absolute left-[3px] right-[3px] overflow-hidden rounded-[7px] border px-[7px] py-1 text-left transition-[box-shadow,filter] hover:shadow-[0_2px_8px_rgba(40,40,46,.08)] hover:brightness-[.98]"
                      style={{
                        top: topFor(a.startTime),
                        height: Math.max(heightFor(a.durationMin), 22),
                        background: isNoShow
                          ? "repeating-linear-gradient(45deg, #f0ddd8 0 6px, #f7ebe7 6px 12px)"
                          : st.bg,
                        borderColor: `${st.rail}44`,
                        borderLeft: `3px solid ${st.rail}`,
                      }}
                    >
                      <div
                        className="tnum overflow-hidden text-ellipsis whitespace-nowrap text-[10.5px] font-bold"
                        style={{
                          color: st.title,
                          textDecoration: a.status === "cancelled" ? "line-through" : "none",
                        }}
                      >
                        {a.startTime} {shortNameOf(a.client.name)}
                      </div>
                      {heightFor(a.durationMin) > 34 && (
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-medium"
                          style={{ color: st.sub }}
                        >
                          {a.service.name}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
