import { mkdirSync } from "node:fs";

import { chromium, type FullConfig } from "@playwright/test";

/**
 * Signs in once with the local test admin and keeps the session for every
 * test. Against a server that uses the production database this login fails,
 * so no test ever writes there.
 */
export default async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("No test admin: run pnpm e2e:admin first.");
  }
  const baseURL = config.projects[0]?.use.baseURL;
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  await page.goto("/admin/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL((url) => url.pathname === "/admin", {
    timeout: 60_000,
  });
  mkdirSync("e2e/.auth", { recursive: true });
  await page.context().storageState({ path: "e2e/.auth/admin.json" });
  await browser.close();
}
