import { notFound } from "next/navigation";
import { getAppointmentByRef, getTenant } from "@/lib/store";
import { ManageBooking } from "@/components/booking/ManageBooking";
import { ManageLookup } from "@/components/booking/ManageLookup";

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const tenant = getTenant(slug);
  if (!tenant) notFound();

  if (!ref) {
    return <ManageLookup tenant={tenant} />;
  }

  const appt = getAppointmentByRef(tenant.id, ref);
  if (!appt) {
    return <ManageLookup tenant={tenant} notFound />;
  }

  return <ManageBooking tenant={tenant} bookingRef={ref.toUpperCase()} initial={appt} />;
}
