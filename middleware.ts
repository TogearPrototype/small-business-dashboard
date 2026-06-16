import { NextResponse, type NextRequest } from "next/server";

/**
 * Multi-tenant host routing (seam — currently a pass-through).
 *
 * In production, each tenant's public booking site is served from either a
 * subdomain (joessalon.bookwith.app) or a connected custom domain
 * (book.joessalon.com). This middleware is where the incoming Host header gets
 * mapped to a tenant slug and rewritten to /book/[slug], so one Next.js app
 * renders every tenant's site.
 *
 * Today the app uses explicit paths (/operator and /book/[slug]) and this is a
 * no-op. To enable host-based routing, look the host up against Neon and
 * rewrite:
 *
 *   const slug = await lookupTenantSlugByHost(host);
 *   if (slug) {
 *     const url = req.nextUrl.clone();
 *     url.pathname = `/book/${slug}${url.pathname}`;
 *     return NextResponse.rewrite(url);
 *   }
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\.).*)"],
};
