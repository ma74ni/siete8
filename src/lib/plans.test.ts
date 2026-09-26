import { describe, expect, it } from "vitest";

import { featuredPlans, lowestPriceCents, type PlanSummary } from "./plans";

// Seeded natural-person signature plans (supabase/seed.sql).
const natural: PlanSummary[] = [
  ["7 días", 6.99],
  ["30 días", 9.99],
  ["1 año", 17.99],
  ["2 años", 26.99],
  ["3 años", 36.99],
  ["4 años", 47.99],
  ["5 años", 54.99],
].map(([name, price], index) => ({
  id: String(index),
  name: name as string,
  priceWithoutVat: price as number,
  vatRate: 0.15,
  recommended: name === "1 año",
  sortOrder: index + 1,
}));

const names = (plans: PlanSummary[]) => plans.map((plan) => plan.name);

describe("featuredPlans", () => {
  it("shows the cheapest, the recommended and the next one (COPY §3)", () => {
    expect(names(featuredPlans(natural))).toEqual([
      "7 días",
      "1 año",
      "2 años",
    ]);
  });

  it("keeps panel order even when the input is shuffled", () => {
    expect(names(featuredPlans([...natural].reverse()))).toEqual([
      "7 días",
      "1 año",
      "2 años",
    ]);
  });

  it("does not repeat a plan that is both cheapest and recommended", () => {
    const plans = natural.map((plan) => ({
      ...plan,
      recommended: plan.name === "7 días",
    }));
    expect(names(featuredPlans(plans))).toEqual(["7 días", "30 días"]);
  });

  it("falls back to the first three without a recommended plan", () => {
    const plans = natural.map((plan) => ({ ...plan, recommended: false }));
    expect(names(featuredPlans(plans))).toEqual(["7 días", "30 días", "1 año"]);
  });

  it("handles the last plan being the recommended one", () => {
    const plans = natural.map((plan) => ({
      ...plan,
      recommended: plan.name === "5 años",
    }));
    expect(names(featuredPlans(plans))).toEqual(["7 días", "5 años"]);
  });
});

describe("lowestPriceCents", () => {
  it("returns the lowest total with VAT", () => {
    // Legal representative: from $24,14 (COPY §3).
    const legal = natural.map((plan) => ({
      ...plan,
      priceWithoutVat: plan.priceWithoutVat + 3,
    }));
    expect(lowestPriceCents(legal)).toBe(1149);
    expect(lowestPriceCents([{ ...natural[2]!, priceWithoutVat: 20.99 }])).toBe(
      2414,
    );
  });

  it("returns null without plans", () => {
    expect(lowestPriceCents([])).toBeNull();
  });
});
