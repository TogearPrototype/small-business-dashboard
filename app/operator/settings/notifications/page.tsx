import { getDefaultTenant, getNotificationPrefs } from "@/lib/store";
import { NotificationsForm } from "@/components/operator/settings/NotificationsForm";

export default function NotificationsSettingsPage() {
  const tenant = getDefaultTenant();
  const prefs = getNotificationPrefs(tenant.id);
  return <NotificationsForm prefs={prefs} />;
}
