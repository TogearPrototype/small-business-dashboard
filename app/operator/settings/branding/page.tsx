import { getDefaultTenant } from "@/lib/store";
import { BrandingSettings } from "@/components/operator/BrandingSettings";

export default async function BrandingSettingsPage() {
  const tenant = await getDefaultTenant();
  return <BrandingSettings tenant={tenant} />;
}
