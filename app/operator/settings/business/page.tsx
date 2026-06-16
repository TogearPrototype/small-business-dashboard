import { getDefaultTenant } from "@/lib/store";
import { BusinessProfileForm } from "@/components/operator/settings/BusinessProfileForm";

export default async function Page() {
  const tenant = await getDefaultTenant();
  return <BusinessProfileForm tenant={tenant} />;
}
