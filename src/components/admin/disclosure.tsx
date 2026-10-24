import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { buttonClasses } from "@/components/sitio/button";
import { cx } from "@/lib/cx";

// Panel organisms (E13-02, DESIGN §12.1).

export type DisclosureVariant = "panel" | "action" | "inline";

/** The chevron that turns when it opens, as in the FAQ (DESIGN §8). */
function Chevron() {
  return (
    <ChevronDown
      aria-hidden
      strokeWidth={1.5}
      className="size-5 shrink-0 transition-transform duration-200 ease-out group-open:rotate-180"
    />
  );
}

const noMarker = "list-none [&::-webkit-details-marker]:hidden";

/**
 * Content shown on demand, with the native `<details>` (keyboard and screen
 * readers work without JavaScript; they announce whether it is open).
 * - `panel`: a bordered box whose title opens it, for a form that belongs to
 *   the page ("Agregar servicio", "Registrar pago").
 * - `action`: its summary is a secondary button, for an action in a row or
 *   next to other buttons ("Renovar").
 * - `inline`: just its title in weight 500, for a small extra inside another
 *   block ("Registrar abono", the services list of the import).
 * All three show a chevron that turns when open.
 */
export function Disclosure({
  summary,
  variant = "panel",
  id,
  defaultOpen,
  children,
}: {
  summary: string;
  variant?: DisclosureVariant;
  /** For links that jump to it, like `#servicio-<id>`. */
  id?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  if (variant === "action") {
    return (
      <details id={id} open={defaultOpen} className="group">
        <summary
          className={cx(buttonClasses("secondary"), "cursor-pointer", noMarker)}
        >
          {summary}
          <Chevron />
        </summary>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
      </details>
    );
  }
  if (variant === "inline") {
    return (
      <details id={id} open={defaultOpen} className="group">
        <summary
          className={cx(
            "inline-flex min-h-11 cursor-pointer items-center gap-2 font-medium",
            noMarker,
          )}
        >
          {summary}
          <Chevron />
        </summary>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
      </details>
    );
  }
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-control border border-border p-5"
    >
      <summary
        className={cx(
          "flex min-h-11 cursor-pointer items-center justify-between gap-4 font-medium",
          noMarker,
        )}
      >
        {summary}
        <Chevron />
      </summary>
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </details>
  );
}
