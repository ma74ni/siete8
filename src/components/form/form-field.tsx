import type { ComponentProps } from "react";

import {
  describedBy,
  FieldError,
  Hint,
  Input,
  Label,
  Textarea,
} from "@/components/form/controls";
import { cx } from "@/lib/cx";

type BaseProps = {
  label: string;
  name: string;
  /** Defaults to `field-<name>`; set it when a page repeats the same form. */
  id?: string;
  hint?: string;
  error?: string;
};

type InputFieldProps = BaseProps &
  Omit<ComponentProps<"input">, "name" | "id"> & { multiline?: false };
type TextareaFieldProps = BaseProps &
  Omit<ComponentProps<"textarea">, "name" | "id"> & { multiline: true };

/**
 * Labeled input or textarea (DESIGN §7), built from the form atoms. Hint and
 * error are linked with aria-describedby. Ids derive from `name` unless `id`
 * is given.
 */
export function FormField(props: InputFieldProps | TextareaFieldProps) {
  const { label, name, hint, error, className, multiline, ...rest } = props;
  const id = props.id ?? `field-${name}`;
  const shared = {
    id,
    name,
    "aria-describedby": describedBy(id, hint, error),
    "aria-invalid": error ? true : undefined,
  };

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea {...(rest as ComponentProps<"textarea">)} {...shared} />
      ) : (
        <Input {...(rest as ComponentProps<"input">)} {...shared} />
      )}
      {hint && <Hint id={id}>{hint}</Hint>}
      {error && <FieldError id={id}>{error}</FieldError>}
    </div>
  );
}
