import "server-only";

import {
  type CatalogService,
  CSV_COLUMNS,
  CLIENT_KIND_LABELS,
  formatDayShort,
  formatDecimal,
  normalizeName,
  renewalText,
} from "@/lib/clients";
import { daysBetween, periodBalance } from "@/lib/payments";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/**
 * Panel reads of the clients (E11-01). RLS: only admins read these tables.
 * The volume is small (tens or hundreds of clients), so lists are joined and
 * filtered here instead of in SQL.
 */

/** Every service (hidden ones too) with its plans and their costs. */
export async function getClientCatalog(): Promise<CatalogService[]> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("service")
    .select(
      `id, name, slug,
       plan(id, name, price_without_vat, vat_rate, duration_value, duration_unit, sort_order,
            plan_cost(cost_without_vat))`,
    )
    .order("name");
  if (error) throw new Error(`Could not load the catalog: ${error.message}`);
  return data.map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    plans: [...service.plan]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        price_without_vat: plan.price_without_vat,
        vat_rate: plan.vat_rate,
        duration_value: plan.duration_value,
        duration_unit: plan.duration_unit,
        cost_without_vat: plan.plan_cost?.cost_without_vat ?? null,
      })),
  }));
}

async function loadClients() {
  const supabase = await createSessionClient();
  const [clients, current, services] = await Promise.all([
    supabase
      .from("client")
      .select("id, kind, name, tax_id, phone, email, notes")
      .order("name"),
    supabase
      .from("client_service_current")
      .select(
        "id, client_id, service_id, plan_id, period_id, detail, renews_every_value, renews_every_unit, status, sold_on, starts_on, expires_on, price_without_vat, vat_rate, cost_without_vat",
      ),
    supabase.from("service").select("id, name").order("name"),
  ]);
  const error = clients.error ?? current.error ?? services.error;
  if (error) throw new Error(`Could not list clients: ${error.message}`);
  return {
    clients: clients.data!,
    current: current.data!,
    services: services.data!,
  };
}

export async function listClientsForAdmin(filters: {
  q?: string;
  servicio?: string;
}) {
  await requireAdmin();
  const { clients, current, services } = await loadClients();
  const serviceName = new Map(services.map((s) => [s.id, s.name]));

  const query = filters.q ? normalizeName(filters.q) : null;
  const rows = clients
    .map((client) => {
      const own = current.filter((cs) => cs.client_id === client.id);
      const active = own.filter((cs) => cs.status === "active");
      const expiries = active
        .map((cs) => cs.expires_on)
        .filter((day): day is string => day !== null)
        .sort();
      return {
        ...client,
        serviceIds: own.map((cs) => cs.service_id),
        services: active.map((cs) =>
          [serviceName.get(cs.service_id!), cs.detail]
            .filter(Boolean)
            .join(", "),
        ),
        nextExpiry: expiries[0] ?? null,
        hasActive: active.length > 0,
      };
    })
    .filter(
      (client) =>
        (!query ||
          [client.name, client.tax_id, client.email].some(
            (value) => value && normalizeName(value).includes(query),
          )) &&
        (!filters.servicio || client.serviceIds.includes(filters.servicio)),
    );
  return { clients: rows, services, total: clients.length };
}

export async function getClientForAdmin(id: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client")
    .select(
      `id, kind, name, tax_id, phone, email, notes, updated_at, lead(id, name),
       client_service(id, service_id, plan_id, detail, renews_every_value, renews_every_unit,
         status, cancelled_at, notes, created_at, updated_at, service(name), plan(name),
         client_service_period(id, sold_on, starts_on, ends_on, price_without_vat, vat_rate,
           cost_without_vat, written_off_on, write_off_reason, created_at, updated_at,
           client_payment(id, paid_on, amount, method, notes, created_at)))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load client ${id}: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    client_service: [...data.client_service]
      // Active first, then by name.
      .sort(
        (a, b) =>
          Number(a.status === "cancelled") - Number(b.status === "cancelled") ||
          (a.service?.name ?? "").localeCompare(b.service?.name ?? "") ||
          a.created_at.localeCompare(b.created_at),
      )
      .map((cs) => ({
        ...cs,
        // Latest first; the first one is the current period, with the same
        // tie-break as client_service_current and "Por vencer".
        client_service_period: [...cs.client_service_period]
          .sort(
            (a, b) =>
              b.starts_on.localeCompare(a.starts_on) ||
              b.created_at.localeCompare(a.created_at),
          )
          .map((period) => ({
            ...period,
            client_payment: [...period.client_payment].sort(
              (a, b) =>
                a.paid_on.localeCompare(b.paid_on) ||
                a.created_at.localeCompare(b.created_at),
            ),
            balance: periodBalance({
              ...period,
              payments: period.client_payment,
            }),
          })),
      })),
  };
}

export type ClientForAdmin = NonNullable<
  Awaited<ReturnType<typeof getClientForAdmin>>
>;

/** RUC and cédula numbers already registered, for the import preview. */
export async function getExistingTaxIds(): Promise<Set<string>> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client")
    .select("tax_id")
    .not("tax_id", "is", null);
  if (error) throw new Error(`Could not read tax ids: ${error.message}`);
  return new Set(data.map((row) => row.tax_id!));
}

/**
 * The clients list in the import format: one row per service with its
 * current period, so the file can be edited and imported again.
 */
export async function exportClientsRows(): Promise<string[][]> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [{ clients, current, services }, plans, payments] = await Promise.all([
    loadClients(),
    supabase.from("plan").select("id, name"),
    supabase.from("client_payment").select("period_id, amount"),
  ]);
  const error = plans.error ?? payments.error;
  if (error) throw new Error(`Could not export clients: ${error.message}`);
  const paidBy = new Map<string, { amount: number }[]>();
  for (const payment of payments.data!) {
    paidBy.set(payment.period_id, [
      ...(paidBy.get(payment.period_id) ?? []),
      payment,
    ]);
  }
  const serviceName = new Map(services.map((s) => [s.id, s.name]));
  const planName = new Map(plans.data!.map((p) => [p.id, p.name]));

  const rows: string[][] = [[...CSV_COLUMNS]];
  for (const client of clients) {
    const base = [
      CLIENT_KIND_LABELS[client.kind].toLowerCase(),
      client.name,
      client.tax_id ?? "",
      client.phone ?? "",
      client.email ?? "",
      client.notes ?? "",
    ];
    const own = current.filter(
      (cs) => cs.client_id === client.id && cs.status === "active",
    );
    if (own.length === 0) rows.push([...base, ...Array(11).fill("")]);
    for (const cs of own) {
      rows.push([
        ...base,
        serviceName.get(cs.service_id!) ?? "",
        cs.plan_id ? (planName.get(cs.plan_id) ?? "") : "",
        cs.detail ?? "",
        cs.renews_every_unit
          ? renewalText(cs.renews_every_value, cs.renews_every_unit)
          : "",
        cs.sold_on ? formatDayShort(cs.sold_on) : "",
        cs.starts_on ? formatDayShort(cs.starts_on) : "",
        cs.expires_on ? formatDayShort(cs.expires_on) : "",
        cs.price_without_vat !== null
          ? formatDecimal(cs.price_without_vat)
          : "",
        cs.vat_rate !== null ? formatDecimal(cs.vat_rate * 100) : "",
        cs.cost_without_vat !== null ? formatDecimal(cs.cost_without_vat) : "",
        cs.period_id &&
        cs.price_without_vat !== null &&
        cs.vat_rate !== null &&
        periodBalance({
          price_without_vat: cs.price_without_vat,
          vat_rate: cs.vat_rate,
          written_off_on: null,
          payments: paidBy.get(cs.period_id) ?? [],
        }).status === "paid"
          ? "sí"
          : "no",
      ]);
    }
  }
  return rows;
}

// Receivables (E11-02) ------------------------------------------------------------

/**
 * Periods with a balance, oldest sale first (RF-CRM-11). Periods marked as
 * "no pagará" are left out; cancelled services still owe what they owe.
 */
export async function listReceivables(today: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client_service_period")
    .select(
      `id, sold_on, starts_on, ends_on, price_without_vat, vat_rate, written_off_on,
       client_payment(amount),
       client_service(detail, service(name), client(id, name, tax_id))`,
    )
    .is("written_off_on", null)
    .order("sold_on");
  if (error) throw new Error(`Could not list receivables: ${error.message}`);

  const rows = data
    .map((period) => ({
      id: period.id,
      sold_on: period.sold_on,
      starts_on: period.starts_on,
      ends_on: period.ends_on,
      client: period.client_service?.client ?? null,
      service: period.client_service?.service?.name ?? "",
      detail: period.client_service?.detail ?? null,
      balance: periodBalance({ ...period, payments: period.client_payment }),
      days: daysBetween(period.sold_on, today),
    }))
    .filter((row) => row.balance.balanceCents > 0);
  return {
    rows,
    totalCents: rows.reduce((sum, row) => sum + row.balance.balanceCents, 0),
  };
}

export async function exportReceivablesRows(today: string) {
  const { rows } = await listReceivables(today);
  const money = (cents: number) => formatDecimal(cents / 100);
  return [
    [
      "cliente",
      "ruc_cedula",
      "servicio",
      "detalle",
      "fecha_venta",
      "desde",
      "hasta",
      "total",
      "pagado",
      "saldo",
      "dias",
    ],
    ...rows.map((row) => [
      row.client?.name ?? "",
      row.client?.tax_id ?? "",
      row.service,
      row.detail ?? "",
      formatDayShort(row.sold_on),
      formatDayShort(row.starts_on),
      row.ends_on ? formatDayShort(row.ends_on) : "",
      money(row.balance.totalCents),
      money(row.balance.paidCents),
      money(row.balance.balanceCents),
      String(row.days),
    ]),
  ];
}
