import { priceWithVatCents } from "@/lib/price";

export type PlanSummary = {
  id: string;
  name: string;
  priceWithoutVat: number;
  vatRate: number;
  recommended: boolean;
  sortOrder: number;
};

const byOrder = (a: PlanSummary, b: PlanSummary) => a.sortOrder - b.sortOrder;
const total = (plan: PlanSummary) =>
  priceWithVatCents(plan.priceWithoutVat, plan.vatRate);

/**
 * The three plans shown in the home page's featured service (COPY §3): the
 * cheapest, the recommended one and the one after it, in panel order.
 * Falls back to the first plans when there is no recommended one.
 */
export function featuredPlans(plans: PlanSummary[]): PlanSummary[] {
  const ordered = [...plans].sort(byOrder);
  const recommendedIndex = ordered.findIndex((plan) => plan.recommended);
  if (recommendedIndex === -1) return ordered.slice(0, 3);

  const cheapest = ordered.reduce((min, plan) =>
    total(plan) < total(min) ? plan : min,
  );
  const picked = new Set([
    cheapest,
    ordered[recommendedIndex]!,
    ...ordered.slice(recommendedIndex + 1, recommendedIndex + 2),
  ]);
  return ordered.filter((plan) => picked.has(plan));
}

/** Lowest total with VAT among the plans, in cents; null when there are none. */
export function lowestPriceCents(plans: PlanSummary[]): number | null {
  if (plans.length === 0) return null;
  return Math.min(...plans.map(total));
}
