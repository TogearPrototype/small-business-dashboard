import Link from "next/link";
import { getAppointments, getDefaultTenant, getStaff } from "@/lib/store";
import { DEMO_DATE } from "@/lib/seed-data";
import { Topbar } from "@/components/operator/Topbar";
import { formatPrice, formatDateLong, STATUS_STYLES, toMinutes } from "@/lib/utils";

// The demo clock — matches the design's 11:24 now-line on 2026-06-15.
const NOW_MINUTES = 11 * 60 + 24;

export default function DashboardPage() {
  const tenant = getDefaultTenant();
  const appts = getAppointments(tenant.id, DEMO_DATE);
  const staffOnToday = getStaff(tenant.id).length;

  const active = appts.filter(
    (a) =>
      a.status !== "cancelled" &&
      toMinutes(a.startTime) <= NOW_MINUTES &&
      toMinutes(a.endTime) > NOW_MINUTES,
  );
  const happeningNow = active[0];

  const upNext = appts
    .filter((a) => toMinutes(a.startTime) > NOW_MINUTES && a.status !== "cancelled")
    .slice(0, 3);

  const billable = appts.filter((a) => a.status !== "cancelled" && a.status !== "noshow");
  const projectedRevenue = billable.reduce((sum, a) => sum + a.priceCents, 0);

  // Utilization: booked minutes vs. total staff working minutes today.
  const bookedMin = billable.reduce((sum, a) => sum + a.durationMin, 0);
  const capacityMin = getStaff(tenant.id).reduce(
    (sum, s) => sum + (toMinutes(s.shiftEnd) - toMinutes(s.shiftStart)),
    0,
  );
  const utilization = capacityMin ? Math.round((bookedMin / capacityMin) * 100) : 0;

  let nowProgress = 0;
  if (happeningNow) {
    const start = toMinutes(happeningNow.startTime);
    nowProgress = Math.round(((NOW_MINUTES - start) / happeningNow.durationMin) * 100);
  }

  return (
    <>
      <Topbar title="Dashboard" subtitle="Today at a glance" tenantSlug={tenant.slug} />
      <div className="flex-1 overflow-auto">
        <div className="fade-in mx-auto max-w-[1080px] px-7 pb-14 pt-8">
          <div className="mb-[22px] flex items-baseline justify-between">
            <div className="font-display text-[26px] font-semibold tracking-[-0.01em]">
              Good morning, Maya
            </div>
            <div className="tnum text-[13px] font-medium text-ink-faint">
              {formatDateLong(DEMO_DATE)} · {staffOnToday} staff on today
            </div>
          </div>

          {happeningNow && (
            <div
              className="mb-[22px] flex items-center gap-[22px] rounded-[18px] border-[1.5px] border-brand bg-brand-tint px-6 py-[22px]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-[7px] text-[11px] font-bold uppercase tracking-[0.12em] text-brand">
                  <span className="now-dot size-2 rounded-full bg-brand" />
                  Happening now
                </div>
                <div className="my-[7px] mb-[3px] font-display text-[28px] font-semibold tracking-[-0.01em]">
                  {happeningNow.client.name}
                </div>
                <div className="text-[13.5px] font-medium text-ink-soft">
                  {happeningNow.service.name} · {happeningNow.staff.name} · started{" "}
                  {happeningNow.startTime}
                </div>
              </div>
              <div className="tnum min-w-[150px] text-right">
                <div className="text-[12.5px] font-medium text-ink-faint">
                  Ends {happeningNow.endTime} · {nowProgress}%
                </div>
                <div
                  className="mt-[9px] h-[7px] w-[150px] overflow-hidden rounded-[5px]"
                  style={{ background: "color-mix(in oklch, var(--brand) 15%, white)" }}
                >
                  <div
                    className="h-full rounded-[5px] bg-brand"
                    style={{ width: `${nowProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-5">
            <div className="flex-[1.5]">
              <div className="mb-[13px] flex items-center justify-between text-[14px] font-semibold">
                <span>Up next</span>
                <Link href="/operator/calendar" className="text-[12.5px] font-semibold text-brand">
                  Open calendar →
                </Link>
              </div>
              <div className="flex flex-col gap-[10px]">
                {upNext.map((a) => (
                  <Link
                    key={a.id}
                    href={`/operator/calendar?appt=${a.id}`}
                    className="flex items-center gap-[14px] rounded-[13px] border border-line bg-surface px-[17px] py-[15px] transition-shadow hover:border-[#d8d5db] hover:shadow-[0_2px_10px_rgba(40,40,46,.05)]"
                  >
                    <div className="tnum w-[52px] font-display text-base font-semibold">
                      {a.startTime}
                    </div>
                    <div
                      className="h-full min-h-[34px] w-[3px] self-stretch rounded-[3px]"
                      style={{ background: STATUS_STYLES[a.status].rail }}
                    />
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold">{a.client.name}</div>
                      <div className="text-[12.5px] font-medium text-ink-faint">
                        {a.service.name} · {a.staff.name}
                      </div>
                    </div>
                    <span className="tnum text-[13px] font-semibold text-ink-soft">
                      {formatPrice(a.priceCents)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-[13px] text-[14px] font-semibold">Today</div>
              <div className="tnum flex flex-col gap-[10px]">
                <StatCard label="Bookings" value={String(billable.length)} />
                <StatCard label="Projected revenue" value={formatPrice(projectedRevenue)} />
                <div className="rounded-[13px] border border-line bg-surface px-[18px] py-4">
                  <div className="mb-[9px] flex items-center justify-between">
                    <span className="text-[13px] font-medium text-ink-soft">Staff utilization</span>
                    <span className="font-display text-[22px] font-semibold">{utilization}%</span>
                  </div>
                  <div className="h-[6px] overflow-hidden rounded-[4px]" style={{ background: "#f0eef2" }}>
                    <div className="h-full rounded-[4px] bg-brand" style={{ width: `${utilization}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[13px] border border-line bg-surface px-[18px] py-4">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <span className="font-display text-[22px] font-semibold">{value}</span>
    </div>
  );
}
