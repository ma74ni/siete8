import { expect, test } from "@playwright/test";

import {
  acceptProforma,
  addProforma,
  createLead,
  servicesTable,
  unique,
  HOSTING,
  HOSTING_TOTAL,
} from "./panel";

test("turns a lead into a client through an accepted proforma", async ({
  page,
}) => {
  const name = unique("Lead E2E");
  await createLead(page, { name, phone: "0991234567" });
  const leadUrl = page.url();

  await addProforma(page, HOSTING);
  await acceptProforma(page);

  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(
    servicesTable(page).getByRole("row", { name: /Hosting/ }),
  ).toContainText(HOSTING_TOTAL);

  await page.goto(leadUrl);
  await expect(page.getByLabel("Estado")).toHaveValue("won");
});
