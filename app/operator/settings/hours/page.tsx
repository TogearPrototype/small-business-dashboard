import { getBusinessHours, getDefaultTenant } from "@/lib/store";
import { BusinessHoursForm } from "@/components/operator/settings/BusinessHoursForm";

export default async function Page() {
  const tenant = await getDefaultTenant();
  const hours = await getBusinessHours(tenant.id);
  return <BusinessHoursForm hours={hours} />;
}
