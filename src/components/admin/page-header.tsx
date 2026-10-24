import Link from "next/link";
import type { ReactNode } from "react";

// Panel organisms (E13-02, DESIGN §12.1).

/**
 * The top of a panel page: an optional link back, the title (the page's only
 * h1), an introduction and the page's main actions, such as "Nuevo cliente".
 * The actions go under the title, on every screen width (DESIGN §12.1).
 */
export function PageHeader({
  title,
  intro,
  back,
  actions,
}: {
  title: string;
  /** One paragraph: text, or inline content when it needs a link. */
  intro?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {back && (
          <Link href={back.href} className="text-small">
            {back.label}
          </Link>
        )}
        <h1 className="text-h2">{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-4">{actions}</div>
      )}
    </div>
  );
}
