import type { ComponentProps, ReactNode } from "react";

import {
  describedBy,
  FieldError,
  Hint,
  Label,
  Select,
} from "@/components/form/controls";
import { cx } from "@/lib/cx";

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

/**
 * Labeled select (E13-01), with optional hint and error. Uncontrolled with
 * `defaultValue`, or controlled with `value` and `onChange` from a client
 * component.
 */
export function SelectField({
  label,
  id,
  hint,
  error,
  className,
  children,
  ...select
}: {
  label: string;
  id: string;
  name: string;
  hint?: string;
  error?: string;
  children: ReactNode;
} & Omit<ComponentProps<"select">, "id" | "name" | "children">) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        {...select}
        id={id}
        aria-describedby={describedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
      >
        {children}
      </Select>
      {hint && <Hint id={id}>{hint}</Hint>}
      {error && <FieldError id={id}>{error}</FieldError>}
    </div>
  );
}
