import { getDefaultTenant } from "@/lib/store";
import { BusinessProfileForm } from "@/components/operator/settings/BusinessProfileForm";

export default function Page() {
  const tenant = getDefaultTenant();
  return <BusinessProfileForm tenant={tenant} />;
}
