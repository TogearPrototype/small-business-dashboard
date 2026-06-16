import { getDefaultTenant, getServices, getStaff } from "@/lib/store";
import { Topbar } from "@/components/operator/Topbar";
import { StaffView } from "@/components/operator/StaffView";

export default function StaffPage() {
  const tenant = getDefaultTenant();
  const staff = getStaff(tenant.id);
  const services = getServices(tenant.id);

  return (
    <>
      <Topbar title="Staff" subtitle={`${staff.length} team members`} tenantSlug={tenant.slug} />
      <StaffView staff={staff} services={services} />
    </>
  );
}
