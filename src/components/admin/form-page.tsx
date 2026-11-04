import type { ReactNode } from "react";

import { PageHeader } from "@/components/admin/page-header";

// Panel templates (E14-02, DESIGN §12.2).

/**
 * The Formulario pattern: a page of its own to create or edit one thing,
 * with the link back, the title, one form (an `ActionForm` with
 * `cancelHref`) and, apart at the end, what deletes it.
 */
export function FormPage({
  title,
  back,
  intro,
  danger,
  children,
}: {
  title: string;
  back: { href: string; label: string };
  intro?: ReactNode;
  /** "Borrar …" with its confirmation, kept away from the main button. */
  danger?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex max-w-[48rem] flex-col gap-8">
      <PageHeader title={title} back={back} intro={intro} />
      {children}
      {danger && (
        <div className="flex flex-col gap-3 border-t border-border pt-8">
          {danger}
        </div>
      )}
    </div>
  );
}
