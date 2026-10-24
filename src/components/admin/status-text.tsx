import type { ReactNode } from "react";

// Panel organisms (E13-02, DESIGN §12.1).

export type StatusTone = "default" | "alert";

/**
 * A state shown as text, never as a colored pill (DESIGN §7): "Vence el …",
 * "Pagado". `alert` (weight 500, `accent`) marks what needs attention, such
 * as "Venció el …" or "Debe $10,69".
 */
export function StatusText({
  tone = "default",
  children,
}: {
  tone?: StatusTone;
  children: ReactNode;
}) {
  return (
    <span className={tone === "alert" ? "font-medium text-accent" : undefined}>
      {children}
    </span>
  );
}
