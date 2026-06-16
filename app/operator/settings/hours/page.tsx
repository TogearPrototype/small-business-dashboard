import { getBusinessHours, getDefaultTenant } from "@/lib/store";
import { BusinessHoursForm } from "@/components/operator/settings/BusinessHoursForm";

export default function Page() {
  const tenant = getDefaultTenant();
  const hours = getBusinessHours(tenant.id);
  return <BusinessHoursForm hours={hours} />;
}
