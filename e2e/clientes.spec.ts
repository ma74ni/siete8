import { expect, test } from "@playwright/test";

import {
  addPayment,
  addService,
  createClient,
  expectNotice,
  historyRows,
  openClient,
  openClientService,
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

  await openClientService(page, "Hosting");
  await addPayment(page, { amount: "50" });
  await page.getByRole("link", { name: `Volver a ${name}` }).click();
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

  await openClientService(page, "Hosting");
  await expect(historyRows(page)).toHaveCount(1);
  await renewService(page);
  await expect(historyRows(page)).toHaveCount(2);
});

test("shows the client's record and service without open forms", async ({
  page,
}) => {
  const name = unique("Cliente E2E");
  await createClient(page, { name, ...HOSTING });
  await openClient(page, name);

  // DESIGN §12.2: a Ficha is read, and every change has its own page. Only
  // one-button actions ("Pagado hoy", "Cancelar servicio") stay: no fields.
  const fields = page
    .getByRole("main")
    .locator("input:not([type=hidden]), select, textarea");
  await expect(fields).toHaveCount(0);
  await expect(page.getByText("Debe", { exact: true })).toBeVisible();
  await expect(page.getByText(HOSTING_TOTAL).first()).toBeVisible();

  await openClientService(page, "Hosting");
  await expect(fields).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pagado hoy" })).toBeVisible();
});

test("pays today and cancels a service, each back with its notice", async ({
  page,
}) => {
  const name = unique("Cliente E2E");
  await createClient(page, { name, ...HOSTING });
  await openClient(page, name);
  await openClientService(page, "Hosting");

  await page.getByRole("button", { name: "Pagado hoy" }).click();
  await expectNotice(page, "Pago registrado.");
  await expect(page.getByText("Al día", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Cancelar servicio" }).click();
  await page.getByRole("button", { name: "Sí, cancelar" }).click();
  await expectNotice(page, "Servicio cancelado.");
  await expect(
    page.getByRole("button", { name: "Reactivar servicio" }),
  ).toBeVisible();
});

test("lists clients 25 to a page", async ({ page }) => {
  await page.goto("/admin/clientes");
  const rows = page
    .getByRole("region", { name: "Clientes" })
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader") });
  await expect(rows).toHaveCount(25);
  await page.getByRole("link", { name: "Siguientes" }).click();
  await expect(page).toHaveURL(/pagina=2/);
  await expect(page.getByText(/^Página 2 de \d+$/)).toBeVisible();
});
