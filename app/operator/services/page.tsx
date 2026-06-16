import { getDefaultTenant, getServices, getStaff } from "@/lib/store";
import { Topbar } from "@/components/operator/Topbar";
import { ServicesView } from "@/components/operator/ServicesView";

export default function ServicesPage() {
  const tenant = getDefaultTenant();
  const services = getServices(tenant.id);
  const staff = getStaff(tenant.id);

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
