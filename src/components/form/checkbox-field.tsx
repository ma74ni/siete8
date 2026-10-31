import type { ComponentProps, ReactNode } from "react";

import { Checkbox, describedBy, FieldError } from "@/components/form/controls";

/**
 * Labeled checkbox with a 44 px touch target (RNF-12). The box lines up with
 * the first line, so a long label (the contact form's consent) can wrap. The
 * error goes under the label, outside it, so it is not read as its name.
 */
export function CheckboxField({
  label,
  name,
  id,
  error,
  ...rest
}: {
  /** Text, or inline content when it needs a link. */
  label: ReactNode;
  name: string;
  id: string;
  error?: string;
  // The field sets its own layout and error state.
} & Omit<
  ComponentProps<"input">,
  "type" | "name" | "id" | "className" | "aria-invalid" | "aria-describedby"
>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex min-h-11 items-start gap-3 py-2">
        <Checkbox
          {...rest}
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, undefined, error)}
          className="mt-1 shrink-0"
        />
        <span>{label}</span>
      </label>
      {error && <FieldError id={id}>{error}</FieldError>}
    </div>
  );
}
