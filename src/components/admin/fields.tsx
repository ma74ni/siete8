import type { ReactNode } from "react";

// Panel building blocks shared by the service, project and post editors.

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t border-border pt-8">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
}
