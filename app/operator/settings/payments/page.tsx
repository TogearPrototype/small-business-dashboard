import { getDefaultTenant, getPaymentSettings } from "@/lib/store";
import { PaymentsForm } from "@/components/operator/settings/PaymentsForm";

export default async function Page() {
  const tenant = await getDefaultTenant();
  const settings = await getPaymentSettings(tenant.id);
  return <PaymentsForm settings={settings} />;
}
