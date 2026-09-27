import type { Database } from "@/lib/database.types";

export type HolderType = Database["public"]["Enums"]["holder_type"];

/** Tab and heading of each holder type (COPY §4). */
export const HOLDER_LABELS: Record<HolderType, string> = {
  natural: "Persona natural",
  legal_entity: "Representante legal",
  not_applicable: "Planes",
};

const HOLDER_ORDER: HolderType[] = [
  "natural",
  "legal_entity",
  "not_applicable",
];

export type PlanWithRequirements = {
  holderType: HolderType;
  sortOrder: number;
  requirements: { text: string; required: boolean; sortOrder: number }[];
};

/** Holder types present among the plans, in display order. */
export function holderTypes(plans: { holderType: HolderType }[]): HolderType[] {
  const present = new Set(plans.map((plan) => plan.holderType));
  return HOLDER_ORDER.filter((holder) => present.has(holder));
}

/**
 * Requirements grouped by holder type (RF-PUB-05). Every plan of a holder type
 * repeats the same list in the database, so texts are deduplicated; a text is
 * required if any plan requires it. Kept in the panel's order.
 */
export function requirementsByHolder(
  plans: PlanWithRequirements[],
): { holderType: HolderType; items: { text: string; required: boolean }[] }[] {
  return holderTypes(plans)
    .map((holderType) => {
      const byText = new Map<string, { required: boolean; order: number }>();
      for (const plan of plans.filter((p) => p.holderType === holderType)) {
        for (const item of plan.requirements) {
          const seen = byText.get(item.text);
          byText.set(item.text, {
            required: (seen?.required ?? false) || item.required,
            order: Math.min(seen?.order ?? Infinity, item.sortOrder),
          });
        }
      }
      const items = [...byText]
        .sort((a, b) => a[1].order - b[1].order)
        .map(([text, { required }]) => ({ text, required }));
      return { holderType, items };
    })
    .filter((group) => group.items.length > 0);
}
