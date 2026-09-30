"use client";

import { type ReactNode, useActionState } from "react";

import { Button } from "@/components/sitio/button";
import { type FormState, IDLE } from "@/lib/admin-forms";
import { cx } from "@/lib/cx";

type ActionFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  /** Says what happens, e.g. "Guardar plan" (the message repeats the verb). */
  submitLabel: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
  className?: string;
  children?: ReactNode;
};

/**
 * Panel form backed by a Server Action (E4-01). The result shows next to the
 * button with the same verb as the action ("Guardar" → "Plan guardado.").
 */
export function ActionForm({
  action,
  submitLabel,
  pendingLabel = "Guardando…",
  variant = "primary",
  className,
  children,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, IDLE);

  return (
    <form action={formAction} className={cx("flex flex-col gap-4", className)}>
      {children}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant={variant} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cx(
            "text-small",
            state.status === "error" && "font-medium text-accent",
          )}
        >
          {state.status !== "idle" && state.message}
        </p>
      </div>
    </form>
  );
}
