import { notFound } from "next/navigation";
import { getTenant } from "@/lib/store";
import { PublicHeader } from "@/components/booking/PublicHeader";
import { PublicFooter } from "@/components/booking/PublicFooter";

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
      className="flex min-h-screen flex-col bg-canvas"
      style={{ ["--brand" as string]: tenant.brandColor }}
    >
      <PublicHeader tenant={tenant} />
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
      <PublicFooter tenant={tenant} />
    </div>
  );
}
