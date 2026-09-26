import { Button } from "@/components/sitio/button";
import { cx } from "@/lib/cx";
import { formatPriceWithVat } from "@/lib/price";

export type PlanRow = {
  id: string;
  name: string;
  /** Short note under the name, e.g. "para un trámite puntual". */
  detail?: string;
  priceWithoutVat: number;
  vatRate: number;
  recommended?: boolean;
  action: { label: string; href: string };
};

type PlanTableProps = {
  /** Accessible name of the table, e.g. "Persona natural". */
  label: string;
  plans: PlanRow[];
  /** Shown next to the recommended plan's name. */
  recommendedLabel?: string;
  /** Shown under the first price, e.g. "incluye IVA" (DESIGN §10). */
  vatNote?: string;
};

/**
 * Plans with their price including VAT (DESIGN §7): row dividers, tabular
 * prices aligned right, recommended row marked with a 3 px left border.
 * Secondary text uses `fg` because the table usually sits on `surface`.
 */
export function PlanTable({
  label,
  plans,
  recommendedLabel,
  vatNote,
}: PlanTableProps) {
  return (
    <table aria-label={label} className="w-full border-collapse text-left">
      <tbody>
        {plans.map((plan, index) => (
          <tr key={plan.id} className="border-b border-border">
            <th
              scope="row"
              id={`plan-${plan.id}`}
              className={cx(
                "py-3 pr-3 align-middle font-medium",
                plan.recommended
                  ? "border-l-[3px] border-action pl-3"
                  : "pl-[calc(0.75rem+3px)]",
              )}
            >
              <span className="block">{plan.name}</span>
              {plan.recommended && recommendedLabel && (
                <span className="block text-small font-normal">
                  {recommendedLabel}
                </span>
              )}
              {plan.detail && (
                <span className="block text-small font-normal">
                  {plan.detail}
                </span>
              )}
            </th>
            <td className="py-3 pr-3 text-right align-middle font-medium whitespace-nowrap tabular-nums">
              {formatPriceWithVat(plan.priceWithoutVat, plan.vatRate)}
              {index === 0 && vatNote && (
                <span className="block text-small font-normal">{vatNote}</span>
              )}
            </td>
            <td className="w-0 py-3 text-right align-middle">
              <Button
                href={plan.action.href}
                variant="secondary"
                className="px-4 whitespace-nowrap"
                // Every row says "Solicitar": the plan name tells them apart.
                aria-describedby={`plan-${plan.id}`}
              >
                {plan.action.label}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
