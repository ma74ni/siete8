import { expect, type Locator, type Page } from "@playwright/test";

// The panel's flows as named steps (E14-00). The tests say what happens; these
// functions say where it happens. When the redesign (E14) moves a form to its
// own page, only the step changes, not the tests. Elements are found by role
// and label, as a screen reader finds them, never by CSS classes.

/**
 * The local seed's yearly hosting plan (supabase/seed.sql): $99 + 15 % VAT.
 * If the seed changes, change it here.
 */
export const HOSTING = { service: "Hosting", plan: "Web Básico" } as const;
export const HOSTING_TOTAL = "$113,85";

/** A name no other test run uses, so tests never trip over old data. */
export function unique(prefix: string): string {
  return `${prefix} ${Date.now().toString(36)}`;
}

/**
 * Opens a `Disclosure` by its summary and returns its content. The summary
 * must be unique within `scope` (each test creates its own records).
 */
async function openDisclosure(scope: Page | Locator, summary: string) {
  const first = scope
    .locator(
      `details:has(> summary:text-is("${summary.replaceAll('"', '\\"')}"))`,
    )
    .first();
  if (
    !(await first.evaluate((element) => (element as HTMLDetailsElement).open))
  ) {
    await first.locator("summary").first().click();
  }
  return first;
}

/** Waits for the message an `ActionForm` shows after saving. */
export async function expectSaved(scope: Page | Locator, message: string) {
  await expect(scope.getByText(message, { exact: true })).toBeVisible();
}

// Clients ---------------------------------------------------------------------

export async function createClient(
  page: Page,
  client: { name: string; service?: string; plan?: string },
) {
  await page.goto("/admin/clientes/nuevo");
  await page.getByLabel("Nombre", { exact: true }).fill(client.name);
  if (client.service) {
    const first = page.getByRole("group", { name: "Primer servicio" });
    await first.getByLabel("Servicio").selectOption({ label: client.service });
    if (client.plan) {
      await first.getByLabel("Plan").selectOption({ label: client.plan });
    }
  }
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await page.waitForURL(/\/admin\/clientes\/[0-9a-f-]{36}$/);
}

export async function openClient(page: Page, name: string) {
  await page.goto(`/admin/clientes?q=${encodeURIComponent(name)}`);
  await page.getByRole("link", { name, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

/** The client's services table. */
export function servicesTable(page: Page) {
  return page.getByRole("region", { name: "Servicios" });
}

export async function addService(
  page: Page,
  service: { service: string; plan?: string },
) {
  const form = await openDisclosure(page, "Agregar servicio");
  await form.getByLabel("Servicio").selectOption({ label: service.service });
  if (service.plan) {
    await form.getByLabel("Plan").selectOption({ label: service.plan });
  }
  await form.getByRole("button", { name: "Agregar servicio" }).click();
  await expectSaved(form, "Servicio agregado.");
  return form;
}

/** The editor of one of the client's services, opened. */
export async function openServiceEditor(page: Page, title: string) {
  return openDisclosure(page, title);
}

export async function renewService(editor: Locator) {
  const form = await openDisclosure(editor, "Renovar");
  await form.getByRole("button", { name: "Renovar servicio" }).click();
  await expect(form.getByText(/^Servicio renovado hasta el /)).toBeVisible();
}

export async function addPayment(editor: Locator, payment: { amount: string }) {
  const form = await openDisclosure(editor, "Registrar abono");
  await form.getByLabel("Monto con IVA").fill(payment.amount);
  await form.getByRole("button", { name: "Registrar pago" }).click();
  await expectSaved(form, "Pago registrado.");
}

// Leads -----------------------------------------------------------------------

export async function createLead(
  page: Page,
  lead: { name: string; phone: string },
) {
  await page.goto("/admin/leads/nuevo");
  await page.getByLabel("Nombre", { exact: true }).fill(lead.name);
  await page.getByLabel("Celular").fill(lead.phone);
  await page.getByLabel("La persona aceptó que la contactemos.").check();
  await page.getByRole("button", { name: "Crear lead" }).click();
  await page.waitForURL(/\/admin\/leads\/[0-9a-f-]{36}$/);
}

export async function addProforma(
  page: Page,
  proforma: { service: string; plan: string },
) {
  const form = await openDisclosure(page, "Nueva proforma");
  await form.getByLabel("Servicio").selectOption({ label: proforma.service });
  await form.getByLabel("Plan").selectOption({ label: proforma.plan });
  await form.getByRole("button", { name: "Registrar proforma" }).click();
  await expectSaved(form, "Proforma registrada.");
}

export async function acceptProforma(page: Page) {
  await page.getByRole("link", { name: "Aceptar", exact: true }).click();
  await page
    .getByRole("button", {
      name: /^Aceptar y (crear cliente|agregar servicio)$/,
    })
    .click();
  await page.waitForURL(/\/admin\/clientes\/[0-9a-f-]{36}$/);
}

// Catalog ---------------------------------------------------------------------

export async function openCatalogService(page: Page, name: string) {
  await page.goto("/admin");
  await page.getByRole("link", { name, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

export async function addPlan(
  page: Page,
  plan: { name: string; price: string; every: "Meses" | "Años" },
) {
  // The form whose button adds a plan: the editor of a new plan.
  const form = page.locator("form", {
    has: page.getByRole("button", { name: "Agregar plan" }),
  });
  await form.getByLabel("Nombre").fill(plan.name);
  await form.getByLabel("Precio sin IVA").fill(plan.price);
  await form.getByLabel("Unidad").selectOption({ label: plan.every });
  await form.getByRole("button", { name: "Agregar plan" }).click();
  await expectSaved(form, "Plan agregado.");
}

// Purchases -------------------------------------------------------------------

export async function createPurchase(
  page: Page,
  purchase: { provider: string; concept: string; cost: string },
) {
  await page.goto("/admin/compras/nueva");
  await page
    .getByLabel("Proveedor", { exact: true })
    .selectOption({ label: "Nuevo proveedor…" });
  await page.getByLabel("Nombre del proveedor nuevo").fill(purchase.provider);
  await page.getByLabel("Concepto").fill(purchase.concept);
  await page.getByLabel("Costo por unidad").fill(purchase.cost);
  await page
    .getByRole("group", { name: "Primer pago" })
    .getByLabel("Monto de la plataforma")
    .fill(purchase.cost);
  await page.getByRole("button", { name: "Crear compra" }).click();
  await page.waitForURL(/\/admin\/compras\/[0-9a-f-]{36}$/);
}

export async function addPurchasePayment(
  page: Page,
  payment: { amount: string },
) {
  const form = await openDisclosure(page, "Registrar pago");
  await form.getByLabel("Monto de la plataforma").fill(payment.amount);
  await form.getByRole("button", { name: "Registrar pago" }).click();
  await expectSaved(form, "Pago registrado.");
}
