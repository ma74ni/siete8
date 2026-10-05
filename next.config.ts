import { withSentryConfig } from "@sentry/nextjs/config";
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

// Security headers (E7-03, RNF-17). Pages are prerendered, so scripts cannot
// carry a per-request nonce: Next's inline bootstrap and the JSON-LD need
// 'unsafe-inline'. Google Analytics (E5-04) loads only after consent, from
// the hosts Google documents for GA4. `next dev` also needs 'unsafe-eval'.
const google = "https://*.googletagmanager.com";
// Cloudflare Turnstile on the contact form (E3-08): script and iframe.
const turnstile = "https://challenges.cloudflare.com";
// With Google signals, GA4 also reports to google.com, the local Google
// domain (google.com.ec) and doubleclick.
const analytics = [
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://*.g.doubleclick.net",
  "https://*.google.com",
  "https://*.google.com.ec",
].join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} ${google} ${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${google} ${analytics}`,
  "font-src 'self'",
  `connect-src 'self' ${google} ${analytics} ${turnstile}`,
  `frame-src ${turnstile}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Without includeSubDomains: other siete8.com hosts (mail) are not ours to force.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Panel image uploads (E4-04): 2 MB files plus the multipart overhead.
    serverActions: { bodySizeLimit: "3mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  env: {
    ...(siteUrl && { NEXT_PUBLIC_SITE_URL: siteUrl }),
    // Netlify's deploy context names the Sentry environment (E7-06).
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.CONTEXT ?? "development",
  },
  // `next dev` blocks its dev-only assets for hosts other than localhost, so
  // the page renders but never hydrates. Allow 127.0.0.1 and, per machine,
  // the network addresses in DEV_ALLOWED_ORIGINS (comma separated, hostnames
  // only, e.g. "192.168.1.20,mi-pc.local"). Only affects development.
  allowedDevOrigins: [
    "127.0.0.1",
    ...(process.env.DEV_ALLOWED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []),
  ],
  images: {
    // AVIF first, WebP as fallback (RNF-07).
    formats: ["image/avif", "image/webp"],
    // Next refuses images from private IPs (SSRF guard). Only lifted when
    // Supabase runs on this machine, for tests against the local database.
    dangerouslyAllowLocalIP: ["127.0.0.1", "localhost"].includes(
      new URL(clientEnv.NEXT_PUBLIC_SUPABASE_URL).hostname,
    ),
    // Only public files of this project's Storage (E1-08 bucket).
    remotePatterns: [
      new URL(
        "/storage/v1/object/public/images/**",
        clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      ),
    ],
  },
};

// Error monitoring (E7-06). The browser reports through /monitoring on this
// site, so the CSP needs no Sentry host and ad blockers do not drop them.
// Source maps are uploaded only when SENTRY_AUTH_TOKEN is set (Netlify);
// SENTRY_ORG and SENTRY_PROJECT come from the environment too.
export default withSentryConfig(nextConfig, {
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
