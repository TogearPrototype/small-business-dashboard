import { getAppointments, getClients, getDefaultTenant } from "@/lib/store";
import { DEMO_DATE, clientHistory } from "@/lib/seed-data";
import { Topbar } from "@/components/operator/Topbar";
import { ClientsView } from "@/components/operator/ClientsView";
import type { AppointmentDetail } from "@/lib/types";

export default function ClientsPage() {
  const tenant = getDefaultTenant();
  const clients = getClients(tenant.id);

  // Upcoming appointments per client (demo day onward).
  const todays = getAppointments(tenant.id, DEMO_DATE);
  const upcomingByClient: Record<string, AppointmentDetail[]> = {};
  for (const a of todays) {
    if (a.status === "cancelled" || a.status === "completed" || a.status === "noshow") continue;
    (upcomingByClient[a.clientId] ??= []).push(a);
  }

  return (
    <>
      <Topbar title="Clients" subtitle={`${clients.length} total`} tenantSlug={tenant.slug} />
      <div className="flex-1 overflow-hidden">
        <ClientsView
          clients={clients}
          upcomingByClient={upcomingByClient}
          historyByClient={clientHistory}
        />
      </div>
    </>
  );
}
