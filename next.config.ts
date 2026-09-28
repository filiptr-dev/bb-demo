import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  agentRules: false,
  // enables forbidden() / unauthorized() and their app/[locale]/forbidden.tsx / unauthorized.tsx pages
  experimental: { authInterrupts: true },
};

export default withNextIntl(nextConfig);
