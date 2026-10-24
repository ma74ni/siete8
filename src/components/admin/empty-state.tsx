import type { ReactNode } from "react";

// Panel organisms (E13-02, DESIGN §12.1).

/**
 * What a list says when it has nothing to show ("Todavía no hay clientes."),
 * with an optional action to add the first one.
 */
export function EmptyState({
  children,
  action,
}: {
  children: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p>{children}</p>
      {action}
    </div>
  );
}
