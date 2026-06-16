import { getDefaultTenant, getPaymentSettings } from "@/lib/store";
import { PaymentsForm } from "@/components/operator/settings/PaymentsForm";

export default function Page() {
  const tenant = getDefaultTenant();
  const settings = getPaymentSettings(tenant.id);
  return <PaymentsForm settings={settings} />;
}
