import { formatDay } from "@/lib/days";
import type { PaymentMethod, PeriodBalance } from "@/lib/payments";

/**
 * What the client's record and its service pages show first (E14-04, DESIGN
 * §12.2 rule 3): what is owed, what expires next and the last payments,
 * built from the periods the panel already loads.
 */

/** Rows of the client's last payments in the record. */
const LATEST_PAYMENTS = 5;

type Payment = {
  id: string;
  paid_on: string;
  amount: number;
  method: PaymentMethod;
  created_at: string;
};

type Period = {
  id: string;
  ends_on: string | null;
  balance: PeriodBalance;
  client_payment: readonly Payment[];
};

type Service = {
  status: "active" | "cancelled";
  service: { name: string } | null;
  plan: { name: string } | null;
  detail: string | null;
  /** Latest first: the first one is the current period. */
  client_service_period: readonly Period[];
};

/** What a service's periods still owe, VAT included, in cents. */
export function owedCents(periods: readonly Period[]): number {
  return periods.reduce((sum, period) => sum + period.balance.balanceCents, 0);
}

export type ClientSummary = {
  /** Cancelled services still owe what they owe, as in Por cobrar. */
  owedCents: number;
  /**
   * What expires next among active services: the one that expired longest
   * ago, which needs attention first, or else the soonest still ahead.
   */
  nextExpiry: { service: string; day: string; expired: boolean } | null;
  activeServices: number;
};

export function clientSummary(
  services: readonly Service[],
  today: string,
): ClientSummary {
  const active = services.filter((service) => service.status === "active");
  // As expiry() says: a period that ends today has already expired.
  const nextExpiry =
    active
      .flatMap((service) => {
        const day = service.client_service_period[0]?.ends_on;
        return day
          ? [{ service: serviceTitle(service), day, expired: day <= today }]
          : [];
      })
      .sort((a, b) => a.day.localeCompare(b.day))[0] ?? null;
  return {
    owedCents: services.reduce(
      (sum, service) => sum + owedCents(service.client_service_period),
      0,
    ),
    nextExpiry,
    activeServices: active.length,
  };
}

type LatestPayment = Payment & { service: string; periodId: string };

/** The client's last payments, the most recent first. */
export function latestPayments(
  services: readonly Service[],
  limit = LATEST_PAYMENTS,
): LatestPayment[] {
  return services
    .flatMap((service) =>
      service.client_service_period.flatMap((period) =>
        period.client_payment.map((payment) => ({
          ...payment,
          service: serviceTitle(service),
          periodId: period.id,
        })),
      ),
    )
    .sort(
      (a, b) =>
        b.paid_on.localeCompare(a.paid_on) ||
        b.created_at.localeCompare(a.created_at),
    )
    .slice(0, limit);
}

/**
 * The period "Registrar pago" pays: the oldest one that still owes, so a
 * payment settles the oldest debt first. Null when nothing is owed.
 */
export function periodToPay<P extends Period>(periods: readonly P[]): P | null {
  return periods.findLast((period) => period.balance.balanceCents > 0) ?? null;
}

/**
 * "Hosting, heladeria.com": the client's service by its name and detail, or
 * its plan when it has no detail, so two of the same service tell apart.
 */
export function serviceTitle(service: {
  service: { name: string } | null;
  plan?: { name: string } | null;
  detail: string | null;
}): string {
  return [service.service?.name, service.detail ?? service.plan?.name]
    .filter(Boolean)
    .join(", ");
}

/**
 * Whether a period's payment shows as an alert: it owes part, or all of it
 * once the period has started. A renewal that has not started yet can wait.
 */
export function paymentNeedsAttention(
  period: { starts_on: string; balance: PeriodBalance },
  today: string,
): boolean {
  return (
    period.balance.status === "partial" ||
    (period.balance.status === "pending" && period.starts_on <= today)
  );
}

/** "Período del {desde} al {hasta}", or "desde el {desde}" when it does not end. */
export function periodName(period: {
  starts_on: string;
  ends_on: string | null;
}): string {
  return period.ends_on
    ? `Período del ${formatDay(period.starts_on)} al ${formatDay(period.ends_on)}`
    : `Período desde el ${formatDay(period.starts_on)}`;
}
