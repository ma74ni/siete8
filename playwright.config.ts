import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

import { isLocalUrl, localSupabase } from "./scripts/local-supabase.mjs";

// End-to-end tests of the panel (E14-00), always against the local Supabase.
// `.env.local` points to production, so three things keep the tests off it:
// the base URL must be on this machine, the test server gets the local
// Supabase in its environment (which wins over every .env file), and every
// test signs in with an admin that only exists locally (`pnpm e2e:admin`).

if (existsSync(".env.e2e.local")) process.loadEnvFile(".env.e2e.local");

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;
if (process.env.E2E_BASE_URL && !isLocalUrl(process.env.E2E_BASE_URL)) {
  throw new Error("Refusing a non-local E2E_BASE_URL: tests only run locally.");
}

// Set only by the CI workflow: test the production build instead of a dev
// server. Not `CI`, which a developer's shell may have for other reasons.
const productionBuild = process.env.E2E_SERVER === "start";

const supabase = localSupabase();
const serverEnv: Record<string, string> = {
  NEXT_PUBLIC_SITE_URL: baseURL,
  NEXT_PUBLIC_SUPABASE_URL: supabase.url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabase.publishableKey,
  SUPABASE_SECRET_KEY: supabase.secretKey,
  // Third parties stay off: empty counts as missing (src/env/schema.ts), so
  // no test sends an email, calls Anthropic, posts to Make or reports to
  // Sentry with production keys from .env.local.
  RESEND_API_KEY: "",
  ADMIN_NOTIFICATION_EMAIL: "",
  ANTHROPIC_API_KEY: "",
  MAKE_WEBHOOK_URL: "",
  TURNSTILE_SECRET_KEY: "",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
  NEXT_PUBLIC_GA_ID: "",
  NEXT_PUBLIC_SENTRY_DSN: "",
};

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  // One shared database: the flows run one after the other.
  workers: 1,
  fullyParallel: false,
  forbidOnly: productionBuild,
  retries: productionBuild ? 1 : 0,
  // `next dev` compiles each page on its first visit.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: productionBuild
    ? [["github"], ["html", { open: "never" }]]
    : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL,
    storageState: "e2e/.auth/admin.json",
    locale: "es-EC",
    timezoneId: "America/Guayaquil",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Locally a `next dev` of its own in .next-e2e, so it never shares the
    // developer's server or build output; in CI the production build.
    command: productionBuild
      ? `pnpm exec next start --port ${PORT}`
      : `pnpm exec next dev --port ${PORT}`,
    env: productionBuild
      ? serverEnv
      : { ...serverEnv, NEXT_DIST_DIR: ".next-e2e" },
    url: `${baseURL}/admin/login`,
    // Never a server it did not start: it could point to any database.
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
