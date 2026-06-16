import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-tenant routing (custom domains / subdomains) is handled in middleware.ts.
  reactStrictMode: true,
};

export default nextConfig;
