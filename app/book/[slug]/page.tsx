import { notFound } from "next/navigation";
import { getServices, getStaff, getTenant } from "@/lib/store";
import { DEMO_DATE } from "@/lib/seed-data";
import { BookingFlow } from "@/components/booking/BookingFlow";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = getTenant(slug);
  if (!tenant) notFound();

  const services = getServices(tenant.id);
  const staff = getStaff(tenant.id);

  return (
    <BookingFlow tenant={tenant} services={services} staff={staff} startDate={DEMO_DATE} />
  );
}
