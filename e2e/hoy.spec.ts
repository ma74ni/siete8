import { expect, test } from "@playwright/test";

import { createLead, unique } from "./panel";

test("shows a new lead on Hoy, linked to its page", async ({ page }) => {
  const name = unique("Lead E2E");
  await createLead(page, { name, phone: "0991234567" });
  const leadUrl = page.url();

  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { level: 1, name: "Hoy" }),
  ).toBeVisible();
  await page
    .getByRole("table", { name: "Leads sin contactar" })
    .getByRole("link", { name, exact: true })
    .click();
  await expect(page).toHaveURL(leadUrl);
});

test("links each section of Hoy to its full list", async ({ page }) => {
  for (const [link, path] of [
    ["Ver todo lo que vence", "/admin/por-vencer"],
    ["Ver todo lo que te deben", "/admin/por-cobrar"],
    ["Ver todos los leads", "/admin/leads"],
  ] as const) {
    await page.goto("/admin");
    await page.getByRole("link", { name: link, exact: true }).click();
    await expect(page).toHaveURL(path);
  }
});

test("the phone menu closes after going to another section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Panel" });
  await expect(nav).toBeHidden();

  await page.getByText("Menú", { exact: true }).click();
  // The account entries share the side bar look, set from a server module.
  const signOut = page.getByRole("button", { name: "Cerrar sesión" });
  expect((await signOut.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await nav.getByRole("link", { name: "Servicios", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Servicios" }),
  ).toBeVisible();
  await expect(nav).toBeHidden();
});
