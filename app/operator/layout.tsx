import { getDefaultTenant } from "@/lib/store";
import { Sidebar } from "@/components/operator/Sidebar";

/**
 * Operator (internal) app shell. For this single-tenant demo it resolves the
 * default tenant; in the multi-tenant SaaS the tenant comes from the
 * authenticated session. The tenant's brand color is injected as --brand here
 * so every descendant tints from it.
 */
export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = getDefaultTenant();

  return (
    <div
      className="flex h-screen overflow-hidden bg-canvas text-ink"
      style={{ ["--brand" as string]: tenant.brandColor }}
    >
      <Sidebar tenant={tenant} />
      <main className="relative flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
