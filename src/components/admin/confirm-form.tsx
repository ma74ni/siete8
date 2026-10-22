"use client";

import { type ReactNode, useActionState, useState } from "react";

import { Button } from "@/components/sitio/button";
import { type FormState, IDLE } from "@/lib/admin-forms";
import { cx } from "@/lib/cx";

/**
 * A form whose action is confirmed in line, like `DeleteButton`, but with
 * fields (a reason, a date). The first button asks; the second one sends.
 */
export function ConfirmForm({
  action,
  label,
  question,
  confirmLabel,
  cancelLabel = "Cancelar",
  children,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  /** e.g. "Marcar como no pagará". */
  label: string;
  question: string;
  /** e.g. "Sí, marcar". */
  confirmLabel: string;
  cancelLabel?: string;
  children?: ReactNode;
}) {
  const [asking, setAsking] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await action(previous, formData);
      setAsking(false);
      return result;
    },
    IDLE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {children}
      {asking ? (
        <div className="flex flex-wrap items-center gap-4">
          <p role="alert" className="font-medium">
            {question}
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : confirmLabel}
          </Button>
          <Button variant="secondary" onClick={() => setAsking(false)}>
            {cancelLabel}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="secondary" onClick={() => setAsking(true)}>
            {label}
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
      )}
    </form>
  );
}
