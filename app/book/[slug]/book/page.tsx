import { notFound } from "next/navigation";
import { getServices, getStaff, getTenant } from "@/lib/store";
import { DEMO_DATE } from "@/lib/seed-data";
import { BookingFlow } from "@/components/booking/BookingFlow";

/**
 * The booking funnel, now living at /book/[slug]/book (it used to be the slug
 * root). Async server component: resolves the tenant + its services/staff and
 * renders the multi-step <BookingFlow>.
 */
export default async function BookFunnelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const [services, staff] = await Promise.all([
    getServices(tenant.id),
    getStaff(tenant.id),
  ]);

  return (
    <BookingFlow tenant={tenant} services={services} staff={staff} startDate={DEMO_DATE} />
  );
}
