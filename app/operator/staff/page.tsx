import { getDefaultTenant, getServices, getStaff } from "@/lib/store";
import { Topbar } from "@/components/operator/Topbar";
import { StaffView } from "@/components/operator/StaffView";

export default async function StaffPage() {
  const tenant = await getDefaultTenant();
  const [staff, services] = await Promise.all([
    getStaff(tenant.id),
    getServices(tenant.id),
  ]);

  return (
    <>
      <Topbar title="Staff" subtitle={`${staff.length} team members`} tenantSlug={tenant.slug} />
      <StaffView staff={staff} services={services} />
    </>
  );
}
