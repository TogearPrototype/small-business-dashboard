import { notFound } from "next/navigation";
import { getServices, getStaff, getTenant } from "@/lib/store";
import { Hero } from "@/components/booking/home/Hero";
import { ServicesPreview } from "@/components/booking/home/ServicesPreview";
import { TeamStrip } from "@/components/booking/home/TeamStrip";
import { InfoSection } from "@/components/booking/home/InfoSection";

/**
 * Tenant HOME page — the public landing page for a booking site. Async server
 * component: resolves the tenant from the slug, loads real services + staff,
 * and composes the marketing sections. Renders inside the site shell
 * (PublicHeader/PublicFooter + max-w <main> from the layout), so it adds no
 * header/footer/width wrapper of its own.
 */
export default async function HomePage({
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
    <div className="pb-4">
      <Hero tenant={tenant} />
      <ServicesPreview slug={tenant.slug} services={services} />
      <TeamStrip staff={staff} />
      <InfoSection tenant={tenant} />
    </div>
  );
}
