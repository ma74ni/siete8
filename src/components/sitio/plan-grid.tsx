import { Button } from "@/components/sitio/button";
import type { PlanRow } from "@/components/sitio/plan-table";
import { cx } from "@/lib/cx";
import { formatPriceWithVat } from "@/lib/price";

type PlanGridProps = {
  /** Accessible name of the list, e.g. "Persona natural". */
  label: string;
  plans: PlanRow[];
  /** Shown under the recommended plan's name. */
  recommendedLabel?: string;
  /** Shown under every price, e.g. "incluye IVA" (DESIGN §10). */
  vatNote?: string;
};

/**
 * Plans as cards (DESIGN §7): one column on narrow screens, as many
 * 12 rem columns as fit on wide ones. The recommended card carries a 3 px
 * left border, like the recommended row of `PlanTable`.
 */
export function PlanGrid({
  label,
  plans,
  recommendedLabel,
  vatNote,
}: PlanGridProps) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4"
    >
      {plans.map((plan) => (
        <li
          key={plan.id}
          className={cx(
            "flex flex-col gap-4 rounded-control border border-border bg-bg p-5",
            plan.recommended && "border-l-[3px] border-l-action",
          )}
        >
          <div className="flex flex-col gap-1">
            <h3 id={`plan-${plan.id}`} className="text-h4">
              {plan.name}
            </h3>
            {plan.recommended && recommendedLabel && (
              <p className="text-small">{recommendedLabel}</p>
            )}
            {plan.detail && <p className="text-small">{plan.detail}</p>}
          </div>
          <p className="mt-auto flex flex-col">
            <span className="text-h3 font-medium tabular-nums">
              {formatPriceWithVat(plan.priceWithoutVat, plan.vatRate)}
            </span>
            {vatNote && <span className="text-small">{vatNote}</span>}
          </p>
          <Button
            href={plan.action.href}
            variant="secondary"
            // Every card says "Solicitar": the plan name tells them apart.
            aria-describedby={`plan-${plan.id}`}
          >
            {plan.action.label}
          </Button>
        </li>
      ))}
    </ul>
  );
}
