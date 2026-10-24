import type { ComponentProps } from "react";

import { cx } from "@/lib/cx";

// Form atoms (E13-01, DESIGN §7): the controls of the site and the panel.
// Fields (FormField, SelectField, CheckboxField) are built from these; pages
// and other components use those or these, never a styled control of their
// own.

/**
 * The look of every text box and select: 48 px tall, `field-border` outline
 * (3:1 against the page), the base focus ring, and the `accent` border when
 * the field is invalid. The only place with these classes.
 */
export function controlClass({
  multiline = false,
  numeric = false,
  className,
}: {
  multiline?: boolean;
  /** Tabular figures, for prices and amounts. */
  numeric?: boolean;
  className?: string;
} = {}): string {
  return cx(
    "w-full rounded-control border border-field-border bg-bg px-3 text-body text-fg",
    "aria-[invalid=true]:border-accent disabled:cursor-not-allowed disabled:opacity-60",
    multiline ? "min-h-32 py-3" : "min-h-12",
    numeric && "tabular-nums",
    className,
  );
}

/** The ids of a field's hint and error, for `aria-describedby`. */
export function describedBy(
  id: string,
  hint?: string,
  error?: string,
): string | undefined {
  return (
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined
  );
}

type Numeric = { numeric?: boolean };

export function Input({
  numeric,
  className,
  ...props
}: ComponentProps<"input"> & Numeric) {
  return <input {...props} className={controlClass({ numeric, className })} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={controlClass({ multiline: true, className })}
    />
  );
}

/** Works with `defaultValue` or with `value` and `onChange`. */
export function Select({
  numeric,
  className,
  ...props
}: ComponentProps<"select"> & Numeric) {
  return <select {...props} className={controlClass({ numeric, className })} />;
}

type Choice = Omit<ComponentProps<"input">, "type">;

/** A checkbox in the brand's action color; pair it with a label of 44 px. */
export function Checkbox({ className, ...props }: Choice) {
  return (
    <input
      {...props}
      type="checkbox"
      className={cx("size-5 accent-action", className)}
    />
  );
}

/** A radio button, styled like the checkbox. */
export function Radio({ className, ...props }: Choice) {
  return (
    <input
      {...props}
      type="radio"
      className={cx("size-5 accent-action", className)}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label {...props} className={cx("font-medium", className)} />;
}

/** Help under a field; its id is `<field id>-hint`. */
export function Hint({ id, children }: { id: string; children: string }) {
  return (
    <p id={`${id}-hint`} className="text-small">
      {children}
    </p>
  );
}

/** The field's error; its id is `<field id>-error`. */
export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={`${id}-error`} className="text-small font-medium text-accent">
      {children}
    </p>
  );
}
