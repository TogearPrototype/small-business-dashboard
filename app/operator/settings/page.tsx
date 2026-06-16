import { getDefaultTenant } from "@/lib/store";
import { Topbar } from "@/components/operator/Topbar";
import { BrandingSettings } from "@/components/operator/BrandingSettings";

export default function SettingsPage() {
  const tenant = getDefaultTenant();
  return (
    <>
      <Topbar title="Settings" subtitle="Branding & white-label" tenantSlug={tenant.slug} />
      <div className="flex-1 overflow-hidden">
        <BrandingSettings tenant={tenant} />
      </div>
    </>
  );
}
