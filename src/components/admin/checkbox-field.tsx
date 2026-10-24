import type { ComponentProps } from "react";

import { Checkbox } from "@/components/form/controls";

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
      <Checkbox {...rest} id={id} name={name} />
      <span>{label}</span>
    </label>
  );
}
