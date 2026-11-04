import { expect, test } from "@playwright/test";

import { addPurchasePayment, createPurchase, unique } from "./panel";

test("creates a purchase and records its payment", async ({ page }) => {
  const concept = unique("Compra E2E");
  await createPurchase(page, {
    provider: unique("Proveedor E2E"),
    concept,
    cost: "20",
  });
  await addPurchasePayment(page, { amount: "21" });

  await page.reload();
  // One row per payment, each with its own amount.
  const payments = page.getByRole("region", { name: "Pagos" });
  await expect(payments.getByRole("row", { name: /\$20,00/ })).toHaveCount(1);
  await expect(payments.getByRole("row", { name: /\$21,00/ })).toHaveCount(1);
  await page.goto("/admin/compras");
  await expect(page.getByRole("link", { name: concept })).toBeVisible();
});
