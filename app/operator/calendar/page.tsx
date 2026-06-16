import { getAppointments, getDefaultTenant, getServices, getStaff } from "@/lib/store";
import { DEMO_DATE } from "@/lib/seed-data";
import { Topbar } from "@/components/operator/Topbar";
import { CalendarDayView } from "@/components/operator/CalendarDayView";
import { NewAppointmentModal } from "@/components/operator/NewAppointmentModal";
import { formatDateLong } from "@/lib/utils";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  const tenant = getDefaultTenant();
  const staff = getStaff(tenant.id);
  const services = getServices(tenant.id);
  const appointments = getAppointments(tenant.id, DEMO_DATE);

  return (
    <>
      <Topbar
        title="Calendar"
        subtitle={`${formatDateLong(DEMO_DATE)} · day view`}
        tenantSlug={tenant.slug}
      />
      <div className="flex-1 overflow-auto">
        <CalendarDayView dateIso={DEMO_DATE} staff={staff} appointments={appointments} />
      </div>
      {isNew && (
        <NewAppointmentModal
          dateIso={DEMO_DATE}
          staff={staff}
          services={services}
        />
      )}
    </>
  );
}
