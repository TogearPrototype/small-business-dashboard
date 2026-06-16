"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Service, Staff, Tenant } from "@/lib/types";
import type { Slot } from "@/lib/availability";
import { fetchSlots, submitBooking } from "@/app/actions";
import { SlotSkeleton } from "@/components/ui/States";
import {
  addDays,
  buildIcs,
  cx,
  dayOfMonth,
  formatDateLabel,
  formatPrice,
  formatPriceExact,
  to12h,
  weekdayLabel,
  weekdayOf,
} from "@/lib/utils";

type Step = "service" | "staff" | "time" | "details" | "review" | "done";

const STEP_INDEX: Record<Step, number> = {
  service: 1,
  staff: 2,
  time: 3,
  details: 4,
  review: 4,
  done: 4,
};

interface BookingState {
  serviceId: string | null;
  staffId: string | null; // null = "no preference"
  date: string | null;
  time: string | null;
  resolvedStaffId: string | null; // actual staff for the chosen slot
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY: BookingState = {
  serviceId: null,
  staffId: null,
  date: null,
  time: null,
  resolvedStaffId: null,
  name: "",
  phone: "",
  email: "",
  notes: "",
};

/** Build the next 14 selectable dates, starting a couple days out (like the design). */
function buildDates(startIso: string): { iso: string; weekday: string; day: number; isSunday: boolean }[] {
  return Array.from({ length: 14 }, (_, i) => {
    const iso = addDays(startIso, i + 2);
    return {
      iso,
      weekday: weekdayLabel(iso).toUpperCase(),
      day: dayOfMonth(iso),
      isSunday: weekdayOf(iso) === 0,
    };
  });
}

export function BookingFlow({
  tenant,
  services,
  staff,
  startDate,
}: {
  tenant: Tenant;
  services: Service[];
  staff: Staff[];
  startDate: string;
}) {
  const [step, setStep] = useState<Step>("service");
  const [s, setS] = useState<BookingState>(EMPTY);
  const [ref, setRef] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const service = services.find((x) => x.id === s.serviceId) ?? null;
  const staffMember = s.staffId ? staff.find((x) => x.id === s.staffId) ?? null : null;
  const dates = useMemo(() => buildDates(startDate), [startDate]);

  const categories = useMemo(() => ["All", ...new Set(services.map((x) => x.category))], [services]);
  const [category, setCategory] = useState("All");
  const visibleServices = category === "All" ? services : services.filter((x) => x.category === category);

  const eligibleStaff = useMemo(
    () => (s.serviceId ? staff.filter((x) => x.serviceIds.includes(s.serviceId!)) : []),
    [staff, s.serviceId],
  );

  function patch(p: Partial<BookingState>) {
    setS((prev) => ({ ...prev, ...p }));
  }

  function confirm() {
    if (!s.serviceId || !s.date || !s.time) return;
    const resolvedStaff = s.resolvedStaffId ?? s.staffId ?? eligibleStaff[0]?.id;
    if (!resolvedStaff) return;
    startTransition(async () => {
      const result = await submitBooking({
        serviceId: s.serviceId!,
        staffId: resolvedStaff,
        date: s.date!,
        startTime: s.time!,
        clientName: s.name,
        clientPhone: s.phone,
        clientEmail: s.email,
        notes: s.notes,
      });
      setRef(result.ref);
      setStep("done");
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-0 sm:p-6">
      {/* Phone frame on desktop; full-bleed on mobile */}
      <div className="flex h-screen w-full flex-col overflow-hidden bg-surface sm:h-[760px] sm:w-[390px] sm:rounded-[34px] sm:border sm:border-line sm:shadow-[0_6px_22px_rgba(0,0,0,.09)]">
        {step !== "done" && (
          <Header
            tenant={tenant}
            step={step}
            onBack={step === "service" ? undefined : () => goBack(step, setStep)}
          />
        )}

        {step === "service" && (
          <ServiceStep
            services={visibleServices}
            categories={categories}
            category={category}
            onCategory={setCategory}
            selected={s.serviceId}
            onSelect={(id) => patch({ serviceId: id, staffId: null, time: null, date: null })}
            onContinue={() => s.serviceId && setStep("staff")}
          />
        )}

        {step === "staff" && service && (
          <StaffStep
            service={service}
            staff={eligibleStaff}
            selected={s.staffId}
            onSelect={(id) => patch({ staffId: id })}
            onContinue={() => setStep("time")}
          />
        )}

        {step === "time" && service && (
          <TimeStep
            tenantSlug={tenant.slug}
            service={service}
            staffId={s.staffId}
            dates={dates}
            selectedDate={s.date}
            selectedTime={s.time}
            onPick={(date, time, resolvedStaffId) => patch({ date, time, resolvedStaffId })}
            onContinue={() => s.date && s.time && setStep("details")}
          />
        )}

        {step === "details" && service && (
          <DetailsStep
            service={service}
            staffName={staffMember?.name ?? "First available"}
            date={s.date!}
            time={s.time!}
            state={s}
            onChange={patch}
            onEdit={() => setStep("service")}
            onContinue={() => s.name && s.phone && setStep("review")}
          />
        )}

        {step === "review" && service && (
          <ReviewStep
            tenant={tenant}
            service={service}
            staffName={staffMember?.name ?? "First available"}
            date={s.date!}
            time={s.time!}
            pending={pending}
            onConfirm={confirm}
          />
        )}

        {step === "done" && service && (
          <DoneStep
            tenant={tenant}
            service={service}
            staffName={staffMember?.name ?? "First available"}
            date={s.date!}
            time={s.time!}
            bookingRef={ref}
          />
        )}
      </div>
    </div>
  );
}

function goBack(step: Step, setStep: (s: Step) => void) {
  const order: Step[] = ["service", "staff", "time", "details", "review"];
  const i = order.indexOf(step);
  if (i > 0) setStep(order[i - 1]);
}

// ---------- shared chrome ----------

function Header({
  tenant,
  step,
  onBack,
}: {
  tenant: Tenant;
  step: Step;
  onBack?: () => void;
}) {
  const idx = STEP_INDEX[step];
  const progress = step === "review" ? 100 : (idx / 4) * 100;
  return (
    <>
      <div className="flex h-[42px] flex-shrink-0 items-center justify-between px-6 text-[13px] font-bold">
        <span className="tnum">9:41</span>
        <span className="h-[10px] w-[18px] rounded-[2px] border-[1.5px] border-ink" />
      </div>
      <div className="flex items-center gap-[9px] border-b border-line-soft px-[22px] py-[14px]">
        {onBack && (
          <button onClick={onBack} className="text-[17px] text-ink-faint" aria-label="Back">
            ‹
          </button>
        )}
        <span className="flex size-6 items-center justify-center rounded-[7px] bg-brand text-[12px] font-bold text-white">
          {tenant.logoMark}
        </span>
        <span className="text-[14px] font-bold">{tenant.name}</span>
        {step !== "review" && (
          <span className="ml-auto text-[11px] font-semibold text-ink-ghost">{idx} / 4</span>
        )}
      </div>
      <div className="h-[3px] bg-line-soft">
        <div className="h-full bg-brand transition-[width]" style={{ width: `${progress}%` }} />
      </div>
    </>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="border-t border-line-soft px-[22px] pb-6 pt-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cx(
          "flex h-[50px] w-full items-center justify-center rounded-[13px] bg-brand text-[15px] font-bold text-white transition-[filter] hover:brightness-95",
          disabled && "opacity-40",
        )}
      >
        {children}
      </button>
    </div>
  );
}

// ---------- step 1: service ----------

function ServiceStep({
  services,
  categories,
  category,
  onCategory,
  selected,
  onSelect,
  onContinue,
}: {
  services: Service[];
  categories: string[];
  category: string;
  onCategory: (c: string) => void;
  selected: string | null;
  onSelect: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="px-[22px] pt-[22px]">
        <div className="font-display text-[22px] font-semibold tracking-[-0.01em]">
          What can we do for you?
        </div>
        <div className="mb-[18px] mt-1 text-[13px] font-medium text-ink-faint">
          Pick a service to get started.
        </div>
        <div className="mb-4 flex flex-wrap gap-[7px]">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onCategory(c)}
              className={cx(
                "rounded-full px-[13px] py-1.5 text-[12px] font-semibold",
                c === category ? "bg-ink text-white" : "border border-line text-ink-faint",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-[22px]">
        {services.map((s) => {
          const active = s.id === selected;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={cx(
                "tnum mb-[10px] flex w-full items-center gap-3 rounded-[14px] px-4 py-[15px] text-left",
                active ? "border-[1.5px] border-brand" : "border border-line",
              )}
            >
              <div className="flex-1">
                <div className="text-[14.5px] font-bold">{s.name}</div>
                <div className="text-[12px] font-medium text-ink-faint">{s.durationMin} min</div>
              </div>
              <div className="text-[15px] font-bold">{formatPrice(s.priceCents)}</div>
              {active && (
                <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <PrimaryButton onClick={onContinue} disabled={!selected}>
        Continue
      </PrimaryButton>
    </>
  );
}

// ---------- step 2: staff ----------

function StaffStep({
  service,
  staff,
  selected,
  onSelect,
  onContinue,
}: {
  service: Service;
  staff: Staff[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="px-[22px] pt-[22px]">
        <div className="font-display text-[22px] font-semibold tracking-[-0.01em]">
          Who would you like?
        </div>
        <div className="mb-[18px] mt-1 text-[13px] font-medium text-ink-faint">
          {service.name} · {service.durationMin} min
        </div>
      </div>
      <div className="flex-1 overflow-auto px-[22px]">
        <button
          onClick={() => onSelect(null)}
          className={cx(
            "mb-[10px] flex w-full items-center gap-[13px] rounded-[14px] px-4 py-[15px] text-left",
            selected === null ? "border-[1.5px] border-brand" : "border border-line",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
            ★
          </span>
          <div className="flex-1">
            <div className="text-[14.5px] font-bold">No preference</div>
            <div className="text-[12px] font-medium text-ink-faint">First available · soonest slots</div>
          </div>
        </button>
        {staff.map((m) => {
          const active = m.id === selected;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={cx(
                "mb-[10px] flex w-full items-center gap-[13px] rounded-[14px] px-4 py-[15px] text-left",
                active ? "border-[1.5px] border-brand" : "border border-line",
              )}
            >
              <span className="size-10 rounded-full" style={{ background: "#e0e0e4" }} />
              <div className="flex-1">
                <div className="text-[14.5px] font-bold">{m.name}</div>
                <div className="text-[12px] font-medium text-ink-faint">{m.role}</div>
              </div>
            </button>
          );
        })}
      </div>
      <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
    </>
  );
}

// ---------- step 3: date & time ----------

function TimeStep({
  tenantSlug,
  service,
  staffId,
  dates,
  selectedDate,
  selectedTime,
  onPick,
  onContinue,
}: {
  tenantSlug: string;
  service: Service;
  staffId: string | null;
  dates: { iso: string; weekday: string; day: number; isSunday: boolean }[];
  selectedDate: string | null;
  selectedTime: string | null;
  onPick: (date: string, time: string, resolvedStaffId: string) => void;
  onContinue: () => void;
}) {
  const [activeDate, setActiveDate] = useState(selectedDate ?? dates[0]?.iso);
  const [slots, setSlots] = useState<{ morning: Slot[]; afternoon: Slot[] }>({ morning: [], afternoon: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSlots(tenantSlug, service.id, activeDate, staffId ?? undefined).then((res) => {
      if (!cancelled) {
        setSlots({ morning: res.morning, afternoon: res.afternoon });
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, service.id, activeDate, staffId]);

  function renderGroup(label: string, list: Slot[]) {
    if (list.length === 0) return null;
    return (
      <>
        <div className="tnum mb-[10px] text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-ghost">
          {label}
        </div>
        <div className="tnum mb-[18px] grid grid-cols-3 gap-[9px]">
          {list.map((slot) => {
            const active = selectedDate === activeDate && selectedTime === slot.time;
            return (
              <button
                key={`${slot.time}-${slot.staffId}`}
                onClick={() => onPick(activeDate, slot.time, slot.staffId)}
                className={cx(
                  "flex h-11 items-center justify-center rounded-[11px] text-[14px] font-semibold",
                  active ? "bg-brand text-white" : "border border-line text-ink-soft",
                )}
              >
                {to12h(slot.time).replace(" ", "").replace(":00", "")}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  const hasSlots = slots.morning.length > 0 || slots.afternoon.length > 0;

  return (
    <>
      <div className="px-[22px] pb-4 pt-5">
        <div className="font-display text-[21px] font-semibold tracking-[-0.01em]">Pick a time</div>
      </div>
      <div className="tnum flex gap-2 overflow-x-auto px-[22px] pb-4">
        {dates.map((d) => {
          const active = d.iso === activeDate;
          return (
            <button
              key={d.iso}
              disabled={d.isSunday}
              onClick={() => setActiveDate(d.iso)}
              className={cx(
                "w-[50px] flex-shrink-0 rounded-[12px] py-[9px] text-center",
                active ? "bg-brand text-white" : "border border-line",
                d.isSunday && "opacity-40",
              )}
            >
              <div className={cx("text-[10px] font-semibold", active ? "opacity-80" : "text-ink-ghost")}>
                {d.weekday}
              </div>
              <div className="text-[17px] font-bold">{d.day}</div>
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto px-[22px]">
        {loading ? (
          <SlotSkeleton count={9} />
        ) : hasSlots ? (
          <>
            {renderGroup("Morning", slots.morning)}
            {renderGroup("Afternoon", slots.afternoon)}
          </>
        ) : (
          <div className="pt-8 text-center text-[13px] font-medium text-ink-ghost">
            No openings this day — try another date.
          </div>
        )}
      </div>
      <PrimaryButton onClick={onContinue} disabled={!selectedTime}>
        {selectedTime ? `Continue · ${to12h(selectedTime)}` : "Select a time"}
      </PrimaryButton>
    </>
  );
}

// ---------- step 4: details ----------

function DetailsStep({
  service,
  staffName,
  date,
  time,
  state,
  onChange,
  onEdit,
  onContinue,
}: {
  service: Service;
  staffName: string;
  date: string;
  time: string;
  state: BookingState;
  onChange: (p: Partial<BookingState>) => void;
  onEdit: () => void;
  onContinue: () => void;
}) {
  const dateLabel = formatDateLabel(date);
  return (
    <>
      <div className="flex-1 overflow-auto px-[22px] pt-[22px]">
        <div className="mb-[18px] font-display text-[22px] font-semibold tracking-[-0.01em]">
          Almost done
        </div>
        <div className="tnum mb-[22px] flex items-center gap-[11px] rounded-[12px] bg-field px-[14px] py-3">
          <span className="h-full min-h-[28px] w-[3px] self-stretch rounded-[3px] bg-brand" />
          <div className="flex-1">
            <div className="text-[13px] font-bold">
              {service.name} · {staffName}
            </div>
            <div className="text-[12px] font-medium text-ink-faint">
              {dateLabel} · {to12h(time)} · {formatPrice(service.priceCents)}
            </div>
          </div>
          <button onClick={onEdit} className="text-[11.5px] font-semibold text-brand">
            Edit
          </button>
        </div>

        <BookingField label="Full name">
          <input
            value={state.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Your name"
            className="h-[46px] w-full rounded-[11px] border border-line px-[14px] text-[13.5px] font-medium"
          />
        </BookingField>
        <BookingField label="Mobile number">
          <input
            value={state.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="(415) 555-0000"
            className="tnum h-[46px] w-full rounded-[11px] border border-line px-[14px] text-[13.5px] font-semibold"
          />
        </BookingField>
        <BookingField label="Email · for confirmation">
          <input
            value={state.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="you@email.com"
            className="h-[46px] w-full rounded-[11px] border border-line px-[14px] text-[13.5px] font-medium"
          />
        </BookingField>
        <BookingField label="Notes · optional">
          <textarea
            value={state.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Anything we should know?"
            className="min-h-[56px] w-full rounded-[11px] border border-line px-[14px] py-3 text-[13px] font-medium"
          />
        </BookingField>
      </div>
      <PrimaryButton onClick={onContinue} disabled={!state.name || !state.phone}>
        Review booking
      </PrimaryButton>
    </>
  );
}

function BookingField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-[15px] block">
      <div className="mb-[7px] text-[12px] font-semibold text-ink-soft">{label}</div>
      {children}
    </label>
  );
}

// ---------- review ----------

function ReviewStep({
  tenant,
  service,
  staffName,
  date,
  time,
  pending,
  onConfirm,
}: {
  tenant: Tenant;
  service: Service;
  staffName: string;
  date: string;
  time: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const dateLabel = formatDateLabel(date);
  return (
    <>
      <div className="flex-1 overflow-auto px-[22px] pt-6">
        <div className="mb-5 font-display text-[22px] font-semibold tracking-[-0.01em]">
          Looks good?
        </div>
        <div className="tnum mb-[18px] overflow-hidden rounded-[16px] border border-line">
          <div className="border-b border-line-soft px-[18px] py-4">
            <div className="font-display text-[18px] font-bold">{service.name}</div>
            <div className="text-[12.5px] font-medium text-ink-faint">{service.durationMin} min</div>
          </div>
          <ReviewRow label="With" value={staffName} />
          <ReviewRow label="When" value={`${dateLabel} · ${to12h(time)}`} />
          <div className="flex items-center px-[18px] py-[13px]">
            <span className="w-20 text-[12.5px] font-medium text-ink-ghost">Total</span>
            <span className="font-display text-[18px] font-bold">
              {formatPriceExact(service.priceCents)}
            </span>
            <span className="ml-auto text-[11px] font-medium text-ink-faint">Pay at studio</span>
          </div>
        </div>
        <div className="text-[11.5px] font-medium leading-[1.5] text-ink-ghost">
          Free to cancel or reschedule up to {tenant.cancellationWindowHours}h before. We’ll text you
          a reminder.
        </div>
      </div>
      <PrimaryButton onClick={onConfirm} disabled={pending}>
        {pending ? "Booking…" : "Confirm booking"}
      </PrimaryButton>
    </>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-line-soft px-[18px] py-[13px]">
      <span className="w-20 text-[12.5px] font-medium text-ink-ghost">{label}</span>
      <span className="text-[13.5px] font-semibold">{value}</span>
    </div>
  );
}

// ---------- done / confirmation ----------

function DoneStep({
  tenant,
  service,
  staffName,
  date,
  time,
  bookingRef,
}: {
  tenant: Tenant;
  service: Service;
  staffName: string;
  date: string;
  time: string;
  bookingRef: string;
}) {
  const d = new Date(date + "T00:00:00Z");
  const month = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const dayNum = d.getUTCDate();
  const weekday = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

  function addToCalendar() {
    const ics = buildIcs({
      title: `${service.name} · ${tenant.name}`,
      date,
      time,
      durationMin: service.durationMin,
      location: `${tenant.name}, ${tenant.address}`,
      description: `Booking ref ${bookingRef}. With ${staffName}.`,
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bookingRef}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[42px] flex-shrink-0 items-center justify-between px-6 text-[13px] font-bold">
        <span className="tnum">9:41</span>
        <span className="h-[10px] w-[18px] rounded-[2px] border-[1.5px] border-ink" />
      </div>
      <div className="px-[26px] pt-10 text-center">
        <div className="mx-auto mb-[22px] flex size-[76px] items-center justify-center rounded-full bg-brand font-display text-[34px] font-bold text-white">
          ✓
        </div>
        <div className="mb-2 font-display text-[25px] font-semibold tracking-[-0.01em]">
          You’re booked
        </div>
        <div className="mb-[26px] text-[13.5px] font-medium leading-[1.5] text-ink-faint">
          A confirmation went to your phone and email. See you soon!
        </div>
      </div>
      <div className="tnum mx-[26px] overflow-hidden rounded-[16px] border border-line text-left">
        <div className="border-b border-line-soft px-[18px] py-4">
          <div className="font-display text-[17px] font-bold">{service.name}</div>
          <div className="text-[12.5px] font-medium text-ink-faint">
            with {staffName} · {service.durationMin} min
          </div>
        </div>
        <div className="flex items-center gap-[13px] px-[18px] py-4">
          <div className="text-center">
            <div className="text-[10px] font-semibold text-ink-ghost">{month}</div>
            <div className="font-display text-[20px] font-bold text-brand">{dayNum}</div>
          </div>
          <div>
            <div className="text-[14px] font-bold">
              {weekday}, {to12h(time)}
            </div>
            <div className="text-[12px] font-medium text-ink-faint">
              {tenant.name} · {tenant.address}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[10px] px-[26px] py-5">
        <button
          onClick={addToCalendar}
          className="flex h-12 items-center justify-center gap-2 rounded-[12px] bg-brand text-[14px] font-bold text-white transition-[filter] hover:brightness-95"
        >
          Add to calendar
        </button>
        <a
          href={`/book/${tenant.slug}/manage?ref=${encodeURIComponent(bookingRef)}`}
          className="flex h-12 items-center justify-center rounded-[12px] border border-line text-[14px] font-semibold text-ink-soft hover:bg-field"
        >
          Manage booking
        </a>
      </div>
      <div className="mt-auto px-[26px] pb-[26px] text-center text-[11.5px] font-medium text-ink-ghost">
        Booking ref · {bookingRef}
      </div>
    </div>
  );
}
