import type { NextConfig } from "next";

import { clientSchema, parseEnv, serverSchema } from "./src/env/schema";

// On Netlify, fall back to the deploy URL so branch and PR previews build
// without extra configuration. Production uses the primary site URL.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NETLIFY === "true"
    ? process.env.CONTEXT === "production"
      ? process.env.URL
      : process.env.DEPLOY_PRIME_URL
    : undefined);

// Fail `next dev`, `next build` and `next start` when a variable is missing.
parseEnv(serverSchema, process.env);
const clientEnv = parseEnv(clientSchema, {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: siteUrl,
});

const nextConfig: NextConfig = {
  env: siteUrl ? { NEXT_PUBLIC_SITE_URL: siteUrl } : {},
  images: {
    // AVIF first, WebP as fallback (RNF-07).
    formats: ["image/avif", "image/webp"],
    // Only public files of this project's Storage (E1-08 bucket).
    remotePatterns: [
      new URL(
        "/storage/v1/object/public/images/**",
        clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      ),
    ],
  },
};

export default nextConfig;
