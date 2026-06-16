import { getDefaultTenant, getNotificationPrefs } from "@/lib/store";
import { NotificationsForm } from "@/components/operator/settings/NotificationsForm";

export default async function NotificationsSettingsPage() {
  const tenant = await getDefaultTenant();
  const prefs = await getNotificationPrefs(tenant.id);
  return <NotificationsForm prefs={prefs} />;
}
