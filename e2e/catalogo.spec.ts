import { expect, test } from "@playwright/test";

import { addPlan, openCatalogService, unique } from "./panel";

test("adds a monthly plan that pre-fills a client's renewal", async ({
  page,
}) => {
  const plan = unique("Plan E2E");
  await openCatalogService(page, "Facturación electrónica");
  await addPlan(page, { name: plan, price: "12", every: "Meses" });

  await page.goto("/admin/clientes/nuevo");
  const first = page.getByRole("group", { name: "Primer servicio" });
  await first
    .getByLabel("Servicio")
    .selectOption({ label: "Facturación electrónica" });
  await first.getByLabel("Plan").selectOption({ label: plan });
  await expect(first.getByLabel("Precio sin IVA")).toHaveValue("12,00");
  await expect(first.getByLabel("Unidad")).toHaveValue("month");
  await expect(first.getByLabel("Cantidad")).toHaveValue("1");
});
