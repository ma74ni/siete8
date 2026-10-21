import "server-only";

import {
  type DurationUnit,
  formatDayShort,
  formatDecimal,
  renewalText,
} from "@/lib/clients";
import {
  licenseUse,
  paymentTotalCents,
  renewalModeLabel,
  unitCostCents,
} from "@/lib/purchases";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/**
 * Panel reads of the purchases (E11-03). RLS: only admins read these tables.
 * Small volume: lists are joined here instead of in SQL.
 */

/** "Heladería: Hosting, heladeria.test", to pick a client's service. */
function clientServiceLabel(cs: {
  detail: string | null;
  service: { name: string } | null;
  client: { name: string } | null;
}) {
  return `${cs.client?.name ?? ""}: ${[cs.service?.name, cs.detail]
    .filter(Boolean)
    .join(", ")}`;
}

/** Providers, catalog services and active client services, for the forms. */
export async function getPurchaseOptions() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [providers, services, clientServices] = await Promise.all([
    supabase.from("provider").select("id, name").order("name"),
    supabase.from("service").select("id, name").order("name"),
    supabase
      .from("client_service")
      .select("id, detail, status, service(name), client(name)")
      .eq("status", "active"),
  ]);
  const error = providers.error ?? services.error ?? clientServices.error;
  if (error)
    throw new Error(`Could not load purchase options: ${error.message}`);
  return {
    providers: providers.data!,
    services: services.data!,
    clientServices: clientServices
      .data!.map((cs) => ({ id: cs.id, label: clientServiceLabel(cs) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export type PurchaseOptions = Awaited<ReturnType<typeof getPurchaseOptions>>;

async function loadPurchases() {
  const supabase = await createSessionClient();
  const [current, providers, links, clientServices] = await Promise.all([
    supabase.from("purchase_current").select("*"),
    supabase.from("provider").select("id, name"),
    supabase.from("purchase_service").select("purchase_id, service(name)"),
    supabase
      .from("client_service")
      .select("id, detail, service(name), client(name)"),
  ]);
  const error =
    current.error ?? providers.error ?? links.error ?? clientServices.error;
  if (error) throw new Error(`Could not list purchases: ${error.message}`);

  const providerName = new Map(providers.data!.map((p) => [p.id, p.name]));
  const clientService = new Map(
    clientServices.data!.map((cs) => [cs.id, clientServiceLabel(cs)]),
  );
  const servicesOf = new Map<string, string[]>();
  for (const link of links.data!) {
    servicesOf.set(link.purchase_id, [
      ...(servicesOf.get(link.purchase_id) ?? []),
      link.service?.name ?? "",
    ]);
  }

  return current
    .data!.map((purchase) => ({
      ...purchase,
      id: purchase.id!,
      provider: providerName.get(purchase.provider_id!) ?? "",
      chargedTo: purchase.client_service_id
        ? (clientService.get(purchase.client_service_id) ?? "")
        : servicesOf.get(purchase.id!)?.sort().join(", ") || "General",
      lastTotalCents:
        purchase.payment_id && purchase.amount !== null
          ? paymentTotalCents({
              amount: purchase.amount,
              vat_amount: purchase.vat_amount ?? 0,
              isd_amount: purchase.isd_amount ?? 0,
            })
          : null,
      renewal: renewalModeLabel({
        renews_every_unit: purchase.renews_every_unit,
        auto_renew: purchase.auto_renew ?? false,
      }),
    }))
    .sort(
      (a, b) =>
        Number(a.status === "cancelled") - Number(b.status === "cancelled") ||
        (a.expires_on ?? "9999").localeCompare(b.expires_on ?? "9999") ||
        a.concept!.localeCompare(b.concept!),
    );
}

export async function listPurchases() {
  await requireAdmin();
  return loadPurchases();
}

export async function exportPurchasesRows(): Promise<string[][]> {
  await requireAdmin();
  const purchases = await loadPurchases();
  const money = (amount: number | null) =>
    amount === null ? "" : formatDecimal(amount);
  return [
    [
      "proveedor",
      "concepto",
      "se_carga_a",
      "renueva_cada",
      "renovacion",
      "cantidad",
      "costo_por_unidad",
      "ultimo_pago",
      "cubre_desde",
      "vence",
      "plataforma",
      "iva",
      "isd",
      "total",
      "estado",
    ],
    ...purchases.map((purchase) => [
      purchase.provider,
      purchase.concept ?? "",
      purchase.chargedTo,
      purchase.renews_every_unit
        ? renewalText(purchase.renews_every_value, purchase.renews_every_unit)
        : "",
      purchase.renewal,
      String(purchase.quantity ?? ""),
      money(purchase.unit_cost),
      purchase.paid_on ? formatDayShort(purchase.paid_on) : "",
      purchase.covers_from ? formatDayShort(purchase.covers_from) : "",
      purchase.expires_on ? formatDayShort(purchase.expires_on) : "",
      money(purchase.amount),
      money(purchase.vat_amount),
      money(purchase.isd_amount),
      purchase.lastTotalCents === null
        ? ""
        : formatDecimal(purchase.lastTotalCents / 100),
      purchase.status === "cancelled" ? "cancelada" : "activa",
    ]),
  ];
}

export async function getPurchase(id: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("purchase")
    .select(
      `id, provider_id, concept, client_service_id, renews_every_value, renews_every_unit,
       auto_renew, quantity, unit_cost, status, cancelled_at, notes, updated_at,
       provider(name), purchase_service(service_id),
       purchase_payment(id, paid_on, covers_from, covers_to, quantity, amount, vat_amount,
         isd_amount, notes, created_at),
       license_assignment(id, email, client_service_id, created_at,
         client_service(detail, service(name), client(name)))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load purchase ${id}: ${error.message}`);
  if (!data) return null;

  const payments = [...data.purchase_payment].sort(
    (a, b) =>
      b.covers_from.localeCompare(a.covers_from) ||
      b.created_at.localeCompare(a.created_at),
  );
  const licenses = [...data.license_assignment]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((license) => ({
      ...license,
      clientLabel: license.client_service
        ? clientServiceLabel(license.client_service)
        : null,
    }));
  return {
    ...data,
    purchase_payment: payments,
    license_assignment: licenses,
    use: licenseUse(data.quantity, licenses.length),
  };
}

export type PurchaseForAdmin = NonNullable<
  Awaited<ReturnType<typeof getPurchase>>
>;

/**
 * For the client page: purchases tied to each of its services, and the
 * licenses each one uses with their cost (taxes included) per cycle.
 */
export async function getPurchasesForClientServices(ids: string[]) {
  await requireAdmin();
  if (ids.length === 0) return new Map<string, ClientServicePurchases>();
  const supabase = await createSessionClient();
  const [own, licenses] = await Promise.all([
    supabase
      .from("purchase_current")
      .select("id, concept, client_service_id, expires_on, status, provider_id")
      .in("client_service_id", ids),
    supabase
      .from("license_assignment")
      .select(
        `client_service_id, email,
         purchase(id, concept, renews_every_value, renews_every_unit,
           purchase_payment(quantity, amount, vat_amount, isd_amount, covers_from, created_at))`,
      )
      .in("client_service_id", ids),
  ]);
  const error = own.error ?? licenses.error;
  if (error)
    throw new Error(`Could not load client purchases: ${error.message}`);
  const providerIds = [...new Set(own.data!.map((p) => p.provider_id!))];
  const { data: providers, error: providerError } = providerIds.length
    ? await supabase.from("provider").select("id, name").in("id", providerIds)
    : { data: [], error: null };
  if (providerError) throw new Error(providerError.message);
  const providerName = new Map(providers!.map((p) => [p.id, p.name]));

  const result = new Map<string, ClientServicePurchases>();
  const entry = (id: string) => {
    if (!result.has(id)) result.set(id, { purchases: [], licenses: [] });
    return result.get(id)!;
  };
  for (const purchase of own.data!) {
    entry(purchase.client_service_id!).purchases.push({
      id: purchase.id!,
      concept: purchase.concept!,
      provider: providerName.get(purchase.provider_id!) ?? "",
      expires_on: purchase.expires_on,
      cancelled: purchase.status === "cancelled",
    });
  }
  for (const license of licenses.data!) {
    if (!license.client_service_id || !license.purchase) continue;
    const group = entry(license.client_service_id).licenses;
    let item = group.find((g) => g.purchaseId === license.purchase!.id);
    if (!item) {
      const last = [...license.purchase.purchase_payment].sort(
        (a, b) =>
          b.covers_from.localeCompare(a.covers_from) ||
          b.created_at.localeCompare(a.created_at),
      )[0];
      item = {
        purchaseId: license.purchase.id,
        concept: license.purchase.concept,
        emails: [],
        count: 0,
        unitCostCents: last ? unitCostCents(last) : null,
        purchaseCycle: {
          value: license.purchase.renews_every_value,
          unit: license.purchase.renews_every_unit,
        },
        cycle: license.purchase.renews_every_unit
          ? renewalText(
              license.purchase.renews_every_value,
              license.purchase.renews_every_unit,
            )
          : null,
      };
      group.push(item);
    }
    item.count += 1;
    if (license.email) item.emails.push(license.email);
  }
  return result;
}

export type ClientServicePurchases = {
  purchases: {
    id: string;
    concept: string;
    provider: string;
    expires_on: string | null;
    cancelled: boolean;
  }[];
  licenses: {
    purchaseId: string;
    concept: string;
    emails: string[];
    count: number;
    unitCostCents: number | null;
    purchaseCycle: { value: number | null; unit: DurationUnit | null };
    cycle: string | null;
  }[];
};
