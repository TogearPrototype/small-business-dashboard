import { getDefaultTenant } from "@/lib/store";
import { BrandingSettings } from "@/components/operator/BrandingSettings";

export default function BrandingSettingsPage() {
  const tenant = getDefaultTenant();
  return <BrandingSettings tenant={tenant} />;
}
