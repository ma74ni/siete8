import type { Database } from "@/lib/database.types";
import { formatCents, priceWithVatCents } from "@/lib/price";

/**
 * What a client owes for a period (E11-02, RF-CRM-09..11). Payments are
 * amounts with VAT; the total comes from the shared VAT function. Nothing of
 * this is stored: it is computed from the period and its payments.
 * Texts from docs/COPY.md §13.
 */

export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: "Transferencia",
  cash: "Efectivo",
  card: "Tarjeta",
  other: "Otro",
};

export type PaymentStatus = "pending" | "partial" | "paid" | "written_off";

export type PeriodBalance = {
  totalCents: number;
  paidCents: number;
  /** What is still owed; zero once paid in full or written off. */
  balanceCents: number;
  status: PaymentStatus;
  label: string;
};

const toCents = (amount: number) => Math.round(amount * 100);

export function periodBalance(period: {
  price_without_vat: number;
  vat_rate: number;
  written_off_on: string | null;
  payments: readonly { amount: number }[];
}): PeriodBalance {
  const totalCents = priceWithVatCents(
    period.price_without_vat,
    period.vat_rate,
  );
  const paidCents = period.payments.reduce(
    (sum, payment) => sum + toCents(payment.amount),
    0,
  );
  const owed = Math.max(0, totalCents - paidCents);

  if (owed === 0) {
    return {
      totalCents,
      paidCents,
      balanceCents: 0,
      status: "paid",
      label: "Pagado",
    };
  }
  if (period.written_off_on) {
    return {
      totalCents,
      paidCents,
      balanceCents: 0,
      status: "written_off",
      label: "No pagará",
    };
  }
  return paidCents > 0
    ? {
        totalCents,
        paidCents,
        balanceCents: owed,
        status: "partial",
        label: `Debe ${formatCents(owed)}`,
      }
    : {
        totalCents,
        paidCents,
        balanceCents: owed,
        status: "pending",
        label: "Pendiente",
      };
}

/** Whole days from `from` to `to` (both "2026-10-12"). */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

/** "Hoy", "Hace 1 día", "Hace 45 días". */
export function ageLabel(days: number): string {
  if (days <= 0) return "Hoy";
  return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
}
