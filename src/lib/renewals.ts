/**
 * What is due in the next 30 days: client services to renew, purchases to pay
 * and the cross alerts between them (E11-04, RF-CRM-12, 13, 15..17). The panel
 * and the weekly email (netlify/functions/weekly-digest.mts) build the same
 * report from the same rows, so this file only uses relative imports and has
 * no data access. Texts from docs/COPY.md §13.
 */

import {
  addPeriod,
  type DurationUnit,
  expiry,
  formatDay,
  formatDayShort,
  formatDecimal,
  renewalText,
  todayInQuito,
} from "./clients";
import { periodBalance } from "./payments";
import { formatCents, priceWithVatCents } from "./price";
import { paymentTotalCents, renewalModeLabel } from "./purchases";

export const DUE_WINDOW_DAYS = 30;

/**
 * What the panel and the weekly email read. PostgREST embeds the relations,
 * so the session client and the plain REST call use the same strings.
 */
export const CLIENT_SERVICES_SELECT =
  "id, detail, status, cancelled_at, renews_every_value, renews_every_unit, service(name), client(id, name), client_service_period(id, sold_on, starts_on, ends_on, price_without_vat, vat_rate, cost_without_vat, written_off_on, created_at, client_payment(amount))";

export const PURCHASES_SELECT =
  "id, concept, status, auto_renew, renews_every_value, renews_every_unit, client_service_id, provider(name), purchase_service(service(name)), purchase_payment(covers_from, covers_to, created_at, amount, vat_amount, isd_amount), license_assignment(email, client_service_id)";

type Status = "active" | "cancelled";

export type ClientServiceRow = {
  id: string;
  detail: string | null;
  status: Status;
  cancelled_at: string | null;
  renews_every_value: number | null;
  renews_every_unit: DurationUnit | null;
  service: { name: string } | null;
  client: { id: string; name: string } | null;
  client_service_period: {
    id: string;
    sold_on: string;
    starts_on: string;
    ends_on: string | null;
    price_without_vat: number;
    vat_rate: number;
    cost_without_vat: number;
    written_off_on: string | null;
    created_at: string;
    client_payment: { amount: number }[];
  }[];
};

export type PurchaseRow = {
  id: string;
  concept: string;
  status: Status;
  auto_renew: boolean;
  renews_every_value: number | null;
  renews_every_unit: DurationUnit | null;
  client_service_id: string | null;
  provider: { name: string } | null;
  purchase_service: { service: { name: string } | null }[];
  purchase_payment: {
    covers_from: string;
    covers_to: string | null;
    created_at: string;
    amount: number;
    vat_amount: number;
    isd_amount: number;
  }[];
  license_assignment: {
    email: string | null;
    client_service_id: string | null;
  }[];
};

type Period = ClientServiceRow["client_service_period"][number];

/** The period a renewal starts from: the latest one, as the panel lists it. */
export function currentPeriod(service: ClientServiceRow): Period | null {
  return (
    [...service.client_service_period].sort(
      (a, b) =>
        b.starts_on.localeCompare(a.starts_on) ||
        b.created_at.localeCompare(a.created_at),
    )[0] ?? null
  );
}

/** The last day that counts as due: today plus 30 days. */
export function dueLimit(today: string): string {
  return addPeriod(today, DUE_WINDOW_DAYS, "day");
}

export type NextPeriod = {
  sold_on: string;
  starts_on: string;
  ends_on: string;
  price_without_vat: number;
  vat_rate: number;
  cost_without_vat: number;
};

/**
 * The period after `current` (RF-CRM-13): sold today, starting the day the
 * previous one ends (as "Registrar pago" does for purchases) and lasting one
 * cycle, with the previous price, VAT and cost. Null for one-off services.
 */
export function nextPeriod(
  service: Pick<ClientServiceRow, "renews_every_value" | "renews_every_unit">,
  current: Pick<
    Period,
    "ends_on" | "price_without_vat" | "vat_rate" | "cost_without_vat"
  > | null,
  today: string,
): NextPeriod | null {
  const { renews_every_value: value, renews_every_unit: unit } = service;
  if (!current || !value || !unit) return null;
  const startsOn = current.ends_on ?? today;
  return {
    sold_on: today,
    starts_on: startsOn,
    ends_on: addPeriod(startsOn, value, unit),
    price_without_vat: current.price_without_vat,
    vat_rate: current.vat_rate,
    cost_without_vat: current.cost_without_vat,
  };
}

/** "Hosting, heladeria.test". */
function serviceTitle(service: ClientServiceRow): string {
  return [service.service?.name, service.detail].filter(Boolean).join(", ");
}

/** "Heladería: Hosting, heladeria.test", as the purchases list shows it. */
function clientServiceLabel(service: ClientServiceRow): string {
  return `${service.client?.name ?? ""}: ${serviceTitle(service)}`;
}

function balanceOf(period: Period | null) {
  return period
    ? periodBalance({ ...period, payments: period.client_payment })
    : null;
}

export type DueClientService = {
  id: string;
  clientId: string | null;
  client: string;
  service: string;
  expiresOn: string;
  /** "Venció el …" / "Vence el …". */
  expiry: string;
  expired: boolean;
  /** Pagado / Pendiente / Debe {saldo} / No pagará. */
  payment: string;
  priceWithVatCents: number;
  renewal: string;
  /** Null for one-off services: no "Renovar". */
  next: NextPeriod | null;
};

export type DuePurchase = {
  id: string;
  provider: string;
  concept: string;
  chargedTo: string;
  expiresOn: string;
  expiry: string;
  expired: boolean;
  /** Automática / Manual / Pago único. */
  renewal: string;
  autoRenew: boolean;
  /** What the last payment cost, taxes included. */
  lastTotalCents: number | null;
};

export type DueReport = {
  alerts: { purchaseId: string; text: string }[];
  clients: DueClientService[];
  purchases: DuePurchase[];
};

/** The latest payment of a purchase, as the panel lists it. */
function lastPayment(purchase: PurchaseRow) {
  return (
    [...purchase.purchase_payment].sort(
      (a, b) =>
        b.covers_from.localeCompare(a.covers_from) ||
        b.created_at.localeCompare(a.created_at),
    )[0] ?? null
  );
}

/** The day a cancellation happened, in Quito: "12 de octubre de 2026". */
function cancelledDay(timestamp: string): string {
  return formatDay(todayInQuito(new Date(timestamp)));
}

/**
 * Purchases you may no longer need to pay (RF-CRM-16): one of a client who owes
 * the service it is for or cancelled it, and shared licenses still assigned to
 * services that were cancelled. Cancelled purchases raise nothing.
 */
export function crossAlerts(
  purchases: readonly PurchaseRow[],
  services: ReadonlyMap<string, ClientServiceRow>,
): DueReport["alerts"] {
  const alerts: DueReport["alerts"] = [];
  for (const purchase of purchases) {
    if (purchase.status !== "active") continue;

    const owner = purchase.client_service_id
      ? services.get(purchase.client_service_id)
      : undefined;
    if (owner) {
      const client = owner.client?.name ?? "";
      if (owner.status === "cancelled") {
        const when = owner.cancelled_at
          ? ` el ${cancelledDay(owner.cancelled_at)}`
          : "";
        alerts.push({
          purchaseId: purchase.id,
          text: `${purchase.concept} es de ${client}, que canceló ${serviceTitle(owner)}${when}.`,
        });
        continue;
      }
      const balance = balanceOf(currentPeriod(owner));
      if (balance && balance.balanceCents > 0) {
        alerts.push({
          purchaseId: purchase.id,
          text: `${purchase.concept} es de ${client}, que te debe ${formatCents(balance.balanceCents)} de ${serviceTitle(owner)}.`,
        });
      }
      continue;
    }

    const leftovers = purchase.license_assignment.flatMap((license) => {
      const service = license.client_service_id
        ? services.get(license.client_service_id)
        : undefined;
      return service?.status === "cancelled"
        ? [license.email ?? service.client?.name ?? ""]
        : [];
    });
    if (leftovers.length > 0) {
      const count =
        leftovers.length === 1
          ? "1 licencia de un cliente que canceló"
          : `${leftovers.length} licencias de clientes que cancelaron`;
      alerts.push({
        purchaseId: purchase.id,
        text: `${purchase.concept}: ${count} (${leftovers.join(", ")}). Quítalas antes de renovar.`,
      });
    }
  }
  return alerts;
}

/**
 * Everything due by today + 30 days, the expired first (RF-CRM-12, 15), with
 * the cross alerts. Cancelled services and purchases are left out; so are the
 * ones that never expire.
 */
export function dueReport(
  services: readonly ClientServiceRow[],
  purchases: readonly PurchaseRow[],
  today: string,
): DueReport {
  const limit = dueLimit(today);
  const byId = new Map(services.map((service) => [service.id, service]));

  const clients = services
    .flatMap((service): DueClientService[] => {
      const current = currentPeriod(service);
      const expiresOn = current?.ends_on;
      if (service.status !== "active" || !current || !expiresOn) return [];
      if (expiresOn > limit) return [];
      const due = expiry(expiresOn, today);
      return [
        {
          id: service.id,
          clientId: service.client?.id ?? null,
          client: service.client?.name ?? "",
          service: serviceTitle(service),
          expiresOn,
          expiry: due.label,
          expired: due.state === "expired",
          payment: balanceOf(current)!.label,
          priceWithVatCents: priceWithVatCents(
            current.price_without_vat,
            current.vat_rate,
          ),
          renewal: renewalText(
            service.renews_every_value,
            service.renews_every_unit,
          ),
          next: nextPeriod(service, current, today),
        },
      ];
    })
    .sort(
      (a, b) =>
        a.expiresOn.localeCompare(b.expiresOn) ||
        a.client.localeCompare(b.client),
    );

  const due = purchases
    .flatMap((purchase): DuePurchase[] => {
      const last = lastPayment(purchase);
      const expiresOn = last?.covers_to;
      if (purchase.status !== "active" || !last || !expiresOn) return [];
      if (expiresOn > limit) return [];
      const owner = purchase.client_service_id
        ? byId.get(purchase.client_service_id)
        : undefined;
      const state = expiry(expiresOn, today);
      return [
        {
          id: purchase.id,
          provider: purchase.provider?.name ?? "",
          concept: purchase.concept,
          chargedTo: owner
            ? clientServiceLabel(owner)
            : purchase.purchase_service
                .map((link) => link.service?.name ?? "")
                .sort()
                .join(", ") || "General",
          expiresOn,
          expiry: state.label,
          expired: state.state === "expired",
          renewal: renewalModeLabel(purchase),
          autoRenew: purchase.auto_renew && purchase.renews_every_unit !== null,
          lastTotalCents: paymentTotalCents(last),
        },
      ];
    })
    .sort(
      (a, b) =>
        a.expiresOn.localeCompare(b.expiresOn) ||
        a.concept.localeCompare(b.concept),
    );

  return { alerts: crossAlerts(purchases, byId), clients, purchases: due };
}

/** Rows of "Exportar a CSV" (COPY §13): clients first, then providers. */
export function dueReportCsvRows(report: DueReport): string[][] {
  const money = (cents: number | null) =>
    cents === null ? "" : formatDecimal(cents / 100);
  return [
    ["tipo", "nombre", "concepto", "vence", "monto", "renovacion"],
    ...report.clients.map((row) => [
      "Cliente",
      row.client,
      row.service,
      formatDayShort(row.expiresOn),
      money(row.priceWithVatCents),
      row.renewal,
    ]),
    ...report.purchases.map((row) => [
      "Proveedor",
      row.provider,
      row.concept,
      formatDayShort(row.expiresOn),
      money(row.lastTotalCents),
      row.renewal,
    ]),
  ];
}

/**
 * The weekly email (RF-CRM-17, COPY §13), or null when nothing is due and there
 * are no alerts: then it is not sent.
 */
export function weeklyDigest(
  report: DueReport,
  siteUrl: string,
): { subject: string; text: string } | null {
  const total = report.clients.length + report.purchases.length;
  if (total === 0 && report.alerts.length === 0) return null;

  const section = (title: string, lines: string[]) =>
    lines.length === 0
      ? []
      : [
          `${title} (${lines.length}):`,
          ...lines.map((line) => `- ${line}`),
          "",
        ];

  const text = [
    "Hola. Esto vence en los próximos 30 días o ya venció.",
    "",
    ...section(
      "Revisa antes de renovar",
      report.alerts.map((alert) => alert.text),
    ),
    ...section(
      "Tus clientes",
      report.clients.map(
        (row) =>
          `${row.client}: ${row.service}. ${row.expiry}. ${row.payment}.`,
      ),
    ),
    ...section(
      "Tus proveedores",
      report.purchases.map(
        (row) =>
          // "Pago único" stays as the panel shows it.
          `${row.provider}: ${row.concept}. ${row.expiry}. ${row.autoRenew ? "Se renueva sola" : row.renewal}.`,
      ),
    ),
    `Renueva y registra los pagos en el panel: ${new URL("/admin/por-vencer", siteUrl).toString()}.`,
    "",
    "Panel de Siete8.",
  ].join("\n");

  return {
    subject:
      total === 0
        ? "Siete8: revisa antes de renovar"
        : total === 1
          ? "Siete8: 1 vencimiento en los próximos 30 días"
          : `Siete8: ${total} vencimientos en los próximos 30 días`,
    text,
  };
}
