import { redirect } from "next/navigation";

/**
 * Legacy manage-booking entry point. The flow now lives at the "My bookings"
 * page (/book/[slug]/appointments); this redirect keeps existing confirmation
 * and reminder links (?ref=…) working. The header highlights "My bookings" for
 * both routes.
 */
export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const target = `/book/${slug}/appointments${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
  redirect(target);
}
