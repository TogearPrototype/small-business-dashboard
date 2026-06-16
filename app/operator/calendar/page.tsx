import {
  getAppointments,
  getAppointmentsInRange,
  getDefaultTenant,
  getServices,
  getStaff,
} from "@/lib/store";
import { DEMO_DATE, DEMO_NOW_MINUTES } from "@/lib/seed-data";
import { Topbar } from "@/components/operator/Topbar";
import { Calendar } from "@/components/operator/Calendar";
import { NewAppointmentModal } from "@/components/operator/NewAppointmentModal";
import { formatDateLong, formatWeekRange, weekDates } from "@/lib/utils";

type View = "day" | "week";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    date?: string;
    view?: string;
    appt?: string;
    client?: string;
  }>;
}) {
  const sp = await searchParams;
  const tenant = await getDefaultTenant();
  const [staff, services] = await Promise.all([
    getStaff(tenant.id),
    getServices(tenant.id),
  ]);

  const date = sp.date ?? DEMO_DATE;
  const view: View = sp.view === "week" ? "week" : "day";

  // Load just the visible range.
  const appointments =
    view === "week"
      ? await getAppointmentsInRange(tenant.id, weekDates(date)[0], weekDates(date)[6])
      : await getAppointments(tenant.id, date);

  const subtitle =
    view === "week" ? `${formatWeekRange(date)} · week view` : `${formatDateLong(date)} · day view`;

  return (
    <>
      <Topbar title="Calendar" subtitle={subtitle} tenantSlug={tenant.slug} />
      <div className="flex-1 overflow-auto">
        <Calendar
          dateIso={date}
          view={view}
          staff={staff}
          appointments={appointments}
          tenantSlug={tenant.slug}
          demoDate={DEMO_DATE}
          demoNowMinutes={DEMO_NOW_MINUTES}
        />
      </div>
      {sp.new && (
        <NewAppointmentModal
          dateIso={date}
          staff={staff}
          services={services}
          prefillClient={sp.client}
        />
      )}
    </>
  );
}
