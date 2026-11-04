import type { Database } from "@/lib/database.types";
import { addPeriod, formatDay } from "@/lib/days";
import { formatCents } from "@/lib/price";

/**
 * Pure helpers of the clients module (E11-01, SRS 3.9): labels, renewal,
 * expiry and money. Days live in days.ts, identification in
 * client-contact.ts and the import in client-import.ts. Texts from
 * docs/COPY.md §13.
 */

export type ClientKind = Database["public"]["Enums"]["client_kind"];
export type DurationUnit = Database["public"]["Enums"]["duration_unit"];

export const CLIENT_KIND_LABELS: Record<ClientKind, string> = {
  person: "Persona",
  company: "Empresa",
};

/** Options of "Se renueva cada"; the empty value is a one-off payment. */
export const RENEWAL_UNIT_LABELS: Record<DurationUnit, string> = {
  day: "Días",
  month: "Meses",
  year: "Años",
};

const UNIT_WORDS: Record<DurationUnit, [string, string]> = {
  day: ["día", "días"],
  month: ["mes", "meses"],
  year: ["año", "años"],
};

/** Default VAT rate for a sale without plan. */
export const DEFAULT_VAT_RATE = 0.15;

/** "Se renueva cada" as typed in a form; an empty unit is a one-off payment. */
export type RenewalInput = { value: string; unit: DurationUnit | "" };

/** A plan's duration as "Se renueva cada"; no plan or no duration: one-off. */
export function planRenewal(
  plan:
    | { duration_value: number | null; duration_unit: DurationUnit | null }
    | undefined,
): RenewalInput {
  return plan?.duration_value && plan.duration_unit
    ? { value: String(plan.duration_value), unit: plan.duration_unit }
    : { value: "", unit: "" };
}

/** "Hasta": one renewal after `start`, or empty when it does not renew. */
export function endsAfter(start: string, renewal: RenewalInput): string {
  const value = Number(renewal.value);
  return start && renewal.unit && value >= 1
    ? addPeriod(start, value, renewal.unit)
    : "";
}

export type Expiry =
  | { state: "none"; label: string }
  | { state: "expired" | "active"; label: string; day: string };

/** "Venció el …", "Vence el …" or "Sin vencimiento". */
export function expiry(expiresOn: string | null, today: string): Expiry {
  if (!expiresOn) return { state: "none", label: "Sin vencimiento" };
  return expiresOn <= today
    ? {
        state: "expired",
        label: `Venció el ${formatDay(expiresOn)}`,
        day: expiresOn,
      }
    : {
        state: "active",
        label: `Vence el ${formatDay(expiresOn)}`,
        day: expiresOn,
      };
}

/**
 * Whether a due date is shown as an alert: it already expired and the service
 * or purchase was not cancelled.
 */
export function needsAttention(due: Expiry, status: string | null): boolean {
  return status !== "cancelled" && due.state === "expired";
}

/** "1 año", "6 meses", or "Pago único" when it does not renew. */
export function renewalText(
  value: number | null,
  unit: DurationUnit | null,
): string {
  if (!value || !unit) return "Pago único";
  return `${value} ${UNIT_WORDS[unit][value === 1 ? 0 : 1]}`;
}

// Money ---------------------------------------------------------------------------

const toCents = (amount: number) => Math.round(amount * 100);

/** Profit of a sale without VAT, in cents: price − direct cost. */
export function profitCents(priceWithoutVat: number, cost: number): number {
  return toCents(priceWithoutVat) - toCents(cost);
}

/** Like `formatCents`, with a minus sign for losses: `-$3,50`. */
export function formatSignedCents(cents: number): string {
  return cents < 0 ? `-${formatCents(-cents)}` : formatCents(cents);
}

/** A decimal with comma, as Excel in Spanish expects: 20.5 → "20,50". */
export function formatDecimal(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

/** The catalog as the import needs it: services with their plans and costs. */
export type CatalogService = {
  id: string;
  name: string;
  slug: string;
  plans: {
    id: string;
    name: string;
    price_without_vat: number;
    vat_rate: number;
    duration_value: number | null;
    duration_unit: DurationUnit | null;
    cost_without_vat: number | null;
  }[];
};
