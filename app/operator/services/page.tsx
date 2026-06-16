import { getDefaultTenant, getServices, getStaff } from "@/lib/store";
import { Topbar } from "@/components/operator/Topbar";
import { ServicesView } from "@/components/operator/ServicesView";

export default async function ServicesPage() {
  const tenant = await getDefaultTenant();
  const [services, staff] = await Promise.all([
    getServices(tenant.id),
    getStaff(tenant.id),
  ]);

  const categoryCount = new Set(services.map((s) => s.category)).size;

  return (
    <>
      <Topbar
        title="Services"
        subtitle={`${services.length} services across ${categoryCount} categories`}
        tenantSlug={tenant.slug}
      />
      <ServicesView services={services} staff={staff} />
    </>
  );
}
