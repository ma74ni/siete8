import type { ReactNode } from "react";

// Panel building blocks shared by the service, project and post editors.

const control =
  "min-h-12 w-full rounded-control border border-field-border bg-bg px-3 text-fg";

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

export function SelectField({
  label,
  id,
  name,
  defaultValue,
  children,
}: {
  label: string;
  id: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={control}
      >
        {children}
      </select>
    </div>
  );
}
