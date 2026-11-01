import { expect, test } from "@playwright/test";

import {
  addPayment,
  addService,
  createClient,
  openClient,
  openServiceEditor,
  renewService,
  servicesTable,
  unique,
  HOSTING,
  HOSTING_TOTAL,
} from "./panel";

test("creates a client with its first service", async ({ page }) => {
  const name = unique("Cliente E2E");
  await createClient(page, { name, ...HOSTING });

  await openClient(page, name);
  const row = servicesTable(page).getByRole("row", { name: /Hosting/ });
  await expect(row).toContainText(HOSTING_TOTAL);
  await expect(row).toContainText(/Vence el /);
});

test("adds a service with its plan's price and renewal", async ({ page }) => {
  const name = unique("Cliente E2E");
  await createClient(page, { name });

  await addService(page, HOSTING);
  await page.reload();
  const row = servicesTable(page).getByRole("row", { name: /Hosting/ });
  await expect(row).toContainText(HOSTING_TOTAL);
  await expect(row).toContainText(/Vence el /);
});

test("records a payment and the balance goes down", async ({ page }) => {
  const name = unique("Cliente E2E");
  await createClient(page, { name, ...HOSTING });
  await openClient(page, name);

  const editor = await openServiceEditor(page, "Hosting");
  await addPayment(editor, { amount: "50" });
  await page.reload();
  await expect(
    servicesTable(page).getByRole("row", { name: /Hosting/ }),
  ).toContainText("Debe $63,85");

  await page.goto("/admin/por-cobrar");
  await expect(page.getByRole("row", { name: new RegExp(name) })).toContainText(
    "$63,85",
  );
});

test("renews a service with the next period", async ({ page }) => {
  const name = unique("Cliente E2E");
  await createClient(page, { name, ...HOSTING });
  await openClient(page, name);

  const editor = await openServiceEditor(page, "Hosting");
  const periods = editor.getByRole("button", { name: "Guardar período" });
  await expect(periods).toHaveCount(1);
  await renewService(editor);
  await page.reload();
  await expect(
    (await openServiceEditor(page, "Hosting")).getByRole("button", {
      name: "Guardar período",
    }),
  ).toHaveCount(2);
});
