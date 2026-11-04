import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

// Panel components (E14-04, DESIGN §12.2).

/**
 * The top of a Ficha: its state and what needs attention ("Debe $63,85",
 * "Próximo vencimiento"), in reading, under a line; the sections that follow
 * bring their own. `large` is for a figure; a sentence stays at heading size.
 */
export function KeyFigures({
  items,
}: {
  items: { label: string; value: ReactNode; large?: boolean }[];
}) {
  return (
    <dl
      className={cx(
        "grid gap-6 border-t border-border pt-6",
        items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dt className="text-small">{item.label}</dt>
          <dd className={item.large ? "text-h3" : "text-h4"}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
