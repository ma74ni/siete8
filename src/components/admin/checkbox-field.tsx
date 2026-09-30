import type { ComponentProps } from "react";

/** Labeled checkbox with a 44 px touch target (RNF-12). */
export function CheckboxField({
  label,
  name,
  id,
  ...rest
}: { label: string; name: string; id: string } & Omit<
  ComponentProps<"input">,
  "type" | "name" | "id"
>) {
  return (
    <label htmlFor={id} className="flex min-h-11 items-center gap-3">
      <input
        {...rest}
        id={id}
        name={name}
        type="checkbox"
        className="size-5 accent-action"
      />
      <span>{label}</span>
    </label>
  );
}
