/**
 * Profits (E11-06, RF-CRM-21, 22): what was sold minus what it cost, without
 * VAT, in whole cents. Pure: the panel loads the rows and these functions
 * add them up. Texts from docs/COPY.md §13.
 *
 * Rules agreed for the two views:
 * - Accrual ("devengado"): a sale counts in the month it was sold, with its
 *   direct cost. A shared purchase is spread over the days it covers, and
 *   only for its unassigned licenses: assigned ones are already in the
 *   direct cost of their clients' periods. What a client will not pay is a
 *   loss in the month it was marked.
 * - Cash ("caja"): income is each client payment without its VAT, when it
 *   was paid; costs are every payment to a provider, when it was paid, plus
 *   the direct cost of the periods that no purchase pays for (a signature
 *   bought from the distributor), on their sale date.
 */

import { formatDecimal } from "./clients";
import { periodBalance } from "./payments";
import { toCents, withoutVatCents } from "./price";
import { paymentTotalCents } from "./purchases";

export type ProfitView = "accrual" | "cash";

export const PROFIT_VIEW_PARAMS: Record<ProfitView, string> = {
  accrual: "devengado",
  cash: "caja",
};

/**
 * The year and view of the address (`?anio=2026&vista=caja`), or the current
 * year in the accrual view when missing or invalid.
 */
export function profitFilters(
  params: { anio?: string | string[]; vista?: string | string[] },
  currentYear: number,
): { year: number; view: ProfitView } {
  const year = Number(params.anio);
  return {
    year:
      Number.isInteger(year) && year >= 2000 && year <= 2100
        ? year
        : currentYear,
    view: params.vista === PROFIT_VIEW_PARAMS.cash ? "cash" : "accrual",
  };
}

/**
 * The years with any sale, payment, loss or purchase coverage, plus the
 * current and the selected one (so the selector always shows what is on
 * screen), newest first.
 */
export function profitYears(
  data: ProfitData,
  currentYear: number,
  selectedYear: number = currentYear,
): number[] {
  const years = new Set([currentYear, selectedYear]);
  const add = (day: string) => years.add(Number(day.slice(0, 4)));
  for (const period of data.periods) {
    add(period.soldOn);
    if (period.writtenOffOn) add(period.writtenOffOn);
    period.payments.forEach((payment) => add(payment.paidOn));
  }
  for (const purchase of data.purchases) {
    for (const payment of purchase.payments) {
      add(payment.paidOn);
      add(payment.coversFrom);
      // The end is excluded: coverage to 1 January stays in the year before.
      if (payment.coversTo) add(addDays(payment.coversTo, -1));
    }
  }
  return [...years].sort((a, b) => b - a);
}

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** A period of a client service, with what it needs for profits. */
export type ProfitPeriod = {
  id: string;
  clientId: string;
  client: string;
  serviceId: string;
  service: string;
  soldOn: string;
  priceWithoutVat: number;
  vatRate: number;
  cost: number;
  writtenOffOn: string | null;
  /** Its cost is paid through a purchase (its own, or licenses it uses). */
  purchaseBacked: boolean;
  payments: { paidOn: string; amount: number }[];
};

export type ProfitPurchasePayment = {
  paidOn: string;
  coversFrom: string;
  coversTo: string | null;
  quantity: number;
  amount: number;
  vatAmount: number;
  isdAmount: number;
};

export type ProfitPurchase = {
  id: string;
  concept: string;
  provider: string;
  /** Set for a purchase of one client: its cost is in that client's periods. */
  clientServiceId: string | null;
  /** Catalog services a shared purchase is charged to; empty: general. */
  services: { id: string; name: string }[];
  /** Licenses in use: assigned to a client's service, an email, or both. */
  assignedLicenses: number;
  /** Of those, the ones a client's service carries in its direct cost. */
  clientLicenses: number;
  payments: ProfitPurchasePayment[];
};

export type ProfitData = {
  periods: ProfitPeriod[];
  purchases: ProfitPurchase[];
};

// Dates -------------------------------------------------------------------------

/** "2026-10-24" → "2026-10". */
const monthOf = (day: string) => day.slice(0, 7);

const DAY_MS = 86_400_000;

function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Splits `cents` over the days from `from` (included) to `to` (excluded, the
 * next period starts that day), by month, proportionally to the days in each.
 * In whole cents that add up exactly. Without a valid end, it all goes to
 * `whole`'s month.
 */
export function spreadByMonth(
  cents: number,
  from: string,
  to: string | null,
  whole: string,
): Map<string, number> {
  const parts = new Map<string, number>();
  const totalDays = to
    ? Math.round(
        (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
          DAY_MS,
      )
    : 0;
  if (!to || totalDays <= 0) {
    parts.set(monthOf(whole), cents);
    return parts;
  }

  const days = new Map<string, number>();
  for (let day = from; day < to; day = addDays(day, 1)) {
    days.set(monthOf(day), (days.get(monthOf(day)) ?? 0) + 1);
  }
  // Rounded on the running total: each month gets the difference between
  // two rounded cumulative amounts. The parts add up exactly; any run of
  // months is within half a cent of its exact share when it touches the
  // start or the end of the coverage, and within one cent otherwise.
  let daysSoFar = 0;
  let centsSoFar = 0;
  for (const [month, monthDays] of days) {
    daysSoFar += monthDays;
    const cumulative = Math.round((cents * daysSoFar) / totalDays);
    parts.set(month, cumulative - centsSoFar);
    centsSoFar = cumulative;
  }
  return parts;
}

// Building blocks ---------------------------------------------------------------

/** What a client still owed when marked "no pagará", without VAT. */
export function lossCents(period: ProfitPeriod): number {
  const balance = periodBalance({
    price_without_vat: period.priceWithoutVat,
    vat_rate: period.vatRate,
    written_off_on: null,
    payments: period.payments,
  });
  return withoutVatCents(balance.balanceCents, period.vatRate);
}

/** A client payment without its period's VAT. */
export function paymentWithoutVatCents(
  amount: number,
  vatRate: number,
): number {
  return withoutVatCents(toCents(amount), vatRate);
}

/** A payment to a provider, taxes included, in cents. */
function purchasePaymentCents(payment: ProfitPurchasePayment): number {
  return paymentTotalCents({
    amount: payment.amount,
    vat_amount: payment.vatAmount,
    isd_amount: payment.isdAmount,
  });
}

/** The share of a payment that `count` of the licenses it paid for cost. */
function licenseShareCents(
  payment: ProfitPurchasePayment,
  count: number,
): number {
  const quantity = Math.max(1, payment.quantity);
  return Math.round(
    (purchasePaymentCents(payment) * Math.min(Math.max(0, count), quantity)) /
      quantity,
  );
}

/**
 * The part of a shared purchase payment that no client carries: all of it
 * but the share of the licenses assigned to clients' services (those are in
 * their periods' direct cost). Licenses used only by an email are Siete8's
 * own cost and stay here. Counted with today's assignments.
 */
export function unassignedShareCents(
  payment: ProfitPurchasePayment,
  clientLicenses: number,
): number {
  if (clientLicenses <= 0) return purchasePaymentCents(payment);
  return licenseShareCents(
    payment,
    Math.max(1, payment.quantity) - clientLicenses,
  );
}

const isShared = (purchase: ProfitPurchase) =>
  purchase.clientServiceId === null;

/** The accrual cost of a shared purchase, by month: unassigned share, spread. */
function sharedAccrualByMonth(purchase: ProfitPurchase): Map<string, number> {
  const months = new Map<string, number>();
  for (const payment of purchase.payments) {
    const parts = spreadByMonth(
      unassignedShareCents(payment, purchase.clientLicenses),
      payment.coversFrom,
      payment.coversTo,
      payment.paidOn,
    );
    for (const [month, cents] of parts) {
      months.set(month, (months.get(month) ?? 0) + cents);
    }
  }
  return months;
}

/** Sum of the parts of `months` in `year`. */
function inYear(months: Map<string, number>, year: number): number {
  let total = 0;
  for (const [month, cents] of months) {
    if (month.startsWith(`${year}-`)) total += cents;
  }
  return total;
}

// Month by month (RF-CRM-21) ---------------------------------------------------

export type ProfitLine = {
  incomeCents: number;
  directCostCents: number;
  sharedCents: number;
  lossCents: number;
  profitCents: number;
};

export type MonthLine = ProfitLine & { month: number; label: string };

const emptyLine = (): Omit<ProfitLine, "profitCents"> => ({
  incomeCents: 0,
  directCostCents: 0,
  sharedCents: 0,
  lossCents: 0,
});

function withProfit(line: Omit<ProfitLine, "profitCents">): ProfitLine {
  return {
    ...line,
    profitCents:
      line.incomeCents -
      line.directCostCents -
      line.sharedCents -
      line.lossCents,
  };
}

/** The twelve months of `year` and their total, in the chosen view. */
export function monthlyProfits(
  data: ProfitData,
  year: number,
  view: ProfitView,
): { months: MonthLine[]; total: ProfitLine } {
  const lines = Array.from({ length: 12 }, emptyLine);
  const add = (
    day: string,
    field: keyof ReturnType<typeof emptyLine>,
    cents: number,
  ) => {
    if (!day.startsWith(`${year}-`)) return;
    lines[Number(day.slice(5, 7)) - 1]![field] += cents;
  };

  for (const period of data.periods) {
    if (view === "accrual") {
      add(period.soldOn, "incomeCents", toCents(period.priceWithoutVat));
      add(period.soldOn, "directCostCents", toCents(period.cost));
      if (period.writtenOffOn) {
        add(period.writtenOffOn, "lossCents", lossCents(period));
      }
    } else {
      for (const payment of period.payments) {
        add(
          payment.paidOn,
          "incomeCents",
          paymentWithoutVatCents(payment.amount, period.vatRate),
        );
      }
      if (!period.purchaseBacked) {
        add(period.soldOn, "directCostCents", toCents(period.cost));
      }
    }
  }

  for (const purchase of data.purchases) {
    if (view === "accrual") {
      if (!isShared(purchase)) continue;
      for (const [month, cents] of sharedAccrualByMonth(purchase)) {
        add(`${month}-01`, "sharedCents", cents);
      }
    } else {
      const field = isShared(purchase) ? "sharedCents" : "directCostCents";
      for (const payment of purchase.payments) {
        add(payment.paidOn, field, purchasePaymentCents(payment));
      }
    }
  }

  const months = lines.map((line, index) => ({
    ...withProfit(line),
    month: index + 1,
    label: MONTH_NAMES[index]!,
  }));
  const total = withProfit(
    lines.reduce(
      (sum, line) => ({
        incomeCents: sum.incomeCents + line.incomeCents,
        directCostCents: sum.directCostCents + line.directCostCents,
        sharedCents: sum.sharedCents + line.sharedCents,
        lossCents: sum.lossCents + line.lossCents,
      }),
      emptyLine(),
    ),
  );
  return { months, total };
}

// By service and by client (RF-CRM-22), always by sale date --------------------

export type ServiceLine = ProfitLine & { key: string; name: string };

/**
 * Accrual profit of `year` by service. A shared purchase charged to one
 * service goes in that service's row; one charged to several, in a row of
 * its own ("Hosting + Correo"); one charged to none, in "General".
 */
export function profitsByService(
  data: ProfitData,
  year: number,
): ServiceLine[] {
  const rows = new Map<
    string,
    { name: string } & ReturnType<typeof emptyLine>
  >();
  const row = (key: string, name: string) => {
    const existing = rows.get(key);
    if (existing) return existing;
    const created = { name, ...emptyLine() };
    rows.set(key, created);
    return created;
  };

  for (const period of data.periods) {
    if (!period.soldOn.startsWith(`${year}-`)) continue;
    const line = row(period.serviceId, period.service);
    line.incomeCents += toCents(period.priceWithoutVat);
    line.directCostCents += toCents(period.cost);
  }
  for (const purchase of data.purchases.filter(isShared)) {
    const cents = inYear(sharedAccrualByMonth(purchase), year);
    if (cents === 0) continue;
    const services = [...purchase.services].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const key =
      services.length === 0
        ? "general"
        : services.map((service) => service.id).join("+");
    const name =
      services.length === 0
        ? "General"
        : services.map((service) => service.name).join(" + ");
    row(key, name).sharedCents += cents;
  }

  return [...rows]
    .map(([key, line]) => ({ key, ...withProfit(line), name: line.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type ClientLine = ProfitLine & { clientId: string; name: string };

/** Accrual profit of `year` by client: price minus direct cost, best first. */
export function profitsByClient(data: ProfitData, year: number): ClientLine[] {
  const rows = new Map<
    string,
    { name: string } & ReturnType<typeof emptyLine>
  >();
  for (const period of data.periods) {
    if (!period.soldOn.startsWith(`${year}-`)) continue;
    const line = rows.get(period.clientId) ?? {
      name: period.client,
      ...emptyLine(),
    };
    line.incomeCents += toCents(period.priceWithoutVat);
    line.directCostCents += toCents(period.cost);
    rows.set(period.clientId, line);
  }
  return [...rows]
    .map(([clientId, line]) => ({
      clientId,
      ...withProfit(line),
      name: line.name,
    }))
    .sort(
      (a, b) => b.profitCents - a.profitCents || a.name.localeCompare(b.name),
    );
}

// Unassigned licenses (RF-CRM-22) ------------------------------------------------

export type UnusedLicenses = {
  purchaseId: string;
  concept: string;
  provider: string;
  quantity: number;
  assigned: number;
  unused: number;
  /** What the unused licenses cost in `year`, spread like the accrual view. */
  costCents: number;
};

/**
 * What a purchase's unused licenses cost in `year`, spread by month. Each
 * payment counts the licenses it paid for that nobody uses: an older payment
 * for fewer licenses is never priced as the latest one.
 */
function unusedCostInYear(purchase: ProfitPurchase, year: number): number {
  let total = 0;
  for (const payment of purchase.payments) {
    const unused = Math.max(1, payment.quantity) - purchase.assignedLicenses;
    total += inYear(
      spreadByMonth(
        licenseShareCents(payment, unused),
        payment.coversFrom,
        payment.coversTo,
        payment.paidOn,
      ),
      year,
    );
  }
  return total;
}

/**
 * Shared purchases with licenses no client uses, by their latest payment's
 * quantity, that cost something in `year`. Only purchases that assign
 * licenses, or pay for more than one.
 */
export function unusedLicenses(
  data: ProfitData,
  year: number,
): UnusedLicenses[] {
  return data.purchases
    .filter(isShared)
    .flatMap((purchase) => {
      const latest = [...purchase.payments].sort((a, b) =>
        b.coversFrom.localeCompare(a.coversFrom),
      )[0];
      if (!latest) return [];
      const quantity = Math.max(1, latest.quantity);
      if (quantity <= 1 && purchase.assignedLicenses === 0) return [];
      const unused = Math.max(0, quantity - purchase.assignedLicenses);
      if (unused === 0) return [];
      return [
        {
          purchaseId: purchase.id,
          concept: purchase.concept,
          provider: purchase.provider,
          quantity,
          assigned: purchase.assignedLicenses,
          unused,
          costCents: unusedCostInYear(purchase, year),
        },
      ];
    })
    .filter((row) => row.costCents > 0)
    .sort((a, b) => b.costCents - a.costCents);
}

// Export ----------------------------------------------------------------------------

/** "Exportar a CSV" (COPY §13): the month by month table, decimals with a comma. */
export function monthlyCsvRows(
  monthly: ReturnType<typeof monthlyProfits>,
  year: number,
): string[][] {
  const money = (cents: number) => formatDecimal(cents / 100);
  const row = (label: string, line: ProfitLine) => [
    label,
    money(line.incomeCents),
    money(line.directCostCents),
    money(line.sharedCents),
    money(line.lossCents),
    money(line.profitCents),
  ];
  return [
    [
      "mes",
      "ingresos",
      "costos_directos",
      "compras_compartidas",
      "perdidas",
      "ganancia",
    ],
    ...monthly.months.map((line) => row(line.label, line)),
    row(`Total ${year}`, monthly.total),
  ];
}
