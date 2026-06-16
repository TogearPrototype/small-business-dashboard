import { notFound } from "next/navigation";
import { getTenant } from "@/lib/store";

// Per-tenant booking site is resolved from live data per request.
export const dynamic = "force-dynamic";

/**
 * Public booking site shell for a single tenant. Resolves the tenant from the
 * URL slug and injects its --brand color. In production this is where custom
 * domains map to a tenant (via middleware rewriting host → slug).
 */
export default async function BookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  return (
    <div
      className="min-h-screen bg-canvas"
      style={{ ["--brand" as string]: tenant.brandColor }}
    >
      {children}
    </div>
  );
}
