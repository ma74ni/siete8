import type { DurationUnit } from "@/lib/clients";
import { renewalText } from "./clients";

/**
 * Pure helpers of the purchases (E11-03, RF-CRM-14). A payment to a provider
 * is what the platform charged plus the VAT and ISD paid here; that total is
 * the real cost. Texts from docs/COPY.md §13.
 */

const toCents = (amount: number) => Math.round(amount * 100);

export type PurchasePaymentAmounts = {
  amount: number;
  vat_amount: number;
  isd_amount: number;
};

/** Platform + VAT + ISD, in cents. */
export function paymentTotalCents(payment: PurchasePaymentAmounts): number {
  return (
    toCents(payment.amount) +
    toCents(payment.vat_amount) +
    toCents(payment.isd_amount)
  );
}

/**
 * What one license or unit really costs, taxes included: the last payment's
 * total divided by the quantity it paid, rounded to the cent.
 */
export function unitCostCents(
  payment: PurchasePaymentAmounts & { quantity: number },
): number {
  return Math.round(paymentTotalCents(payment) / Math.max(1, payment.quantity));
}

type Cycle = { value: number | null; unit: DurationUnit | null };

/** A cycle in months, or in days for daily cycles; null when one-off. */
function cycleLength(
  cycle: Cycle,
): { months: number } | { days: number } | null {
  if (!cycle.unit || !cycle.value) return null;
  if (cycle.unit === "day") return { days: cycle.value };
  return { months: cycle.unit === "year" ? cycle.value * 12 : cycle.value };
}

/**
 * What a client service's licenses cost in one of its periods, in cents: the
 * unit cost times the licenses, scaled from the purchase's cycle to the
 * service's (a monthly license in a yearly service costs 12 times). A one-off
 * purchase counts once. Null when the cycles can't be compared: a recurring
 * purchase in a one-off service, or days against months.
 */
export function licensesCostCents(
  unitCents: number,
  count: number,
  purchaseCycle: Cycle,
  serviceCycle: Cycle,
): number | null {
  const purchase = cycleLength(purchaseCycle);
  if (!purchase) return unitCents * count;
  const service = cycleLength(serviceCycle);
  if (!service) return null;
  if ("months" in purchase && "months" in service)
    return Math.round((unitCents * count * service.months) / purchase.months);
  if ("days" in purchase && "days" in service)
    return Math.round((unitCents * count * service.days) / purchase.days);
  return null;
}

/**
 * The cost of all the licenses a client service uses, for one of its periods.
 * Null when it has none, or when one of them has no payment yet or can't be
 * brought to the service's cycle: then nothing is prefilled.
 */
export function serviceLicensesCostCents(
  licenses: {
    unitCostCents: number | null;
    count: number;
    purchaseCycle: Cycle;
  }[],
  serviceCycle: Cycle,
): number | null {
  if (licenses.length === 0) return null;
  let total = 0;
  for (const license of licenses) {
    if (license.unitCostCents === null) return null;
    const cost = licensesCostCents(
      license.unitCostCents,
      license.count,
      license.purchaseCycle,
      serviceCycle,
    );
    if (cost === null) return null;
    total += cost;
  }
  return total;
}

/** "Automática", "Manual" or "Pago único". */
export function renewalModeLabel(purchase: {
  renews_every_unit: DurationUnit | null;
  auto_renew: boolean;
}): string {
  if (!purchase.renews_every_unit) return "Pago único";
  return purchase.auto_renew ? "Automática" : "Manual";
}

/** "1 año", for "{costo} por {ciclo}"; one-off purchases have no cycle. */
export function cycleText(
  value: number | null,
  unit: DurationUnit | null,
): string | null {
  return unit ? renewalText(value, unit) : null;
}

export type LicenseUse = {
  quantity: number;
  assigned: number;
  unused: number;
};

/** "8 de 10 asignadas, 2 sin uso"; more assigned than paid shows 0 unused. */
export function licenseUse(quantity: number, assigned: number): LicenseUse {
  return { quantity, assigned, unused: Math.max(0, quantity - assigned) };
}

export function licenseUseLabel(use: LicenseUse): string {
  return `${use.assigned} de ${use.quantity} asignadas, ${use.unused} sin uso.`;
}
