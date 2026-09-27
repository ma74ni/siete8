import type { ComponentProps } from "react";

import { cx } from "@/lib/cx";

type BaseProps = {
  label: string;
  name: string;
  hint?: string;
  error?: string;
};

type InputFieldProps = BaseProps &
  Omit<ComponentProps<"input">, "name" | "id"> & { multiline?: false };
type TextareaFieldProps = BaseProps &
  Omit<ComponentProps<"textarea">, "name" | "id"> & { multiline: true };

const control =
  "w-full rounded-control border border-field-border bg-bg px-3 text-body text-fg aria-[invalid=true]:border-accent";

/**
 * Labeled input or textarea (DESIGN §7): 48 px tall, `field-border` outline
 * (3:1 against the page) and the base focus ring. Hint and error are linked
 * with aria-describedby. Ids derive from `name`, unique per form.
 */
export function FormField(props: InputFieldProps | TextareaFieldProps) {
  const { label, name, hint, error, className, multiline, ...rest } = props;
  const id = `field-${name}`;
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  const shared = {
    id,
    name,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  };

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {multiline ? (
        <textarea
          {...(rest as ComponentProps<"textarea">)}
          {...shared}
          className={cx(control, "min-h-32 py-3")}
        />
      ) : (
        <input
          {...(rest as ComponentProps<"input">)}
          {...shared}
          className={cx(control, "min-h-12")}
        />
      )}
      {hint && (
        <p id={`${id}-hint`} className="text-small">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-small font-medium text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
