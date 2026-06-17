import { notFound } from "next/navigation";
import { getAppointmentByRef, getTenant } from "@/lib/store";
import { MyAppointments } from "@/components/booking/MyAppointments";

/**
 * "My bookings" — the public, no-account way to look up a booking by reference
 * and then view / reschedule / cancel it. With no ?ref it shows the lookup
 * form; with a ?ref it resolves the booking and shows the card + actions (or
 * the lookup with a not-found notice). Renders inside the site shell.
 */
export default async function AppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  if (!ref) {
    return <MyAppointments tenant={tenant} />;
  }

  const appt = await getAppointmentByRef(tenant.id, ref);
  if (!appt) {
    return <MyAppointments tenant={tenant} notFound />;
  }

  return <MyAppointments tenant={tenant} bookingRef={ref.toUpperCase()} initial={appt} />;
}
