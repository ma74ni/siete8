"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/sitio/button";
import { type FormState, IDLE } from "@/lib/admin-forms";

/**
 * Delete with an inline confirmation (E4-01): the first click asks, the
 * second one deletes. No browser dialog.
 */
export function DeleteButton({
  action,
  id,
  label,
  question,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  id: string;
  /** e.g. "Borrar plan". */
  label: string;
  /** e.g. "¿Borrar el plan 1 año? Esto no se puede deshacer." */
  question: string;
}) {
  const [asking, setAsking] = useState(false);
  const [state, formAction, pending] = useActionState(action, IDLE);

  if (!asking) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" onClick={() => setAsking(true)}>
          {label}
        </Button>
        {state.status === "error" && (
          <p role="alert" className="text-small font-medium text-accent">
            {state.message}
          </p>
        )}
      </div>
    );
  }

  return (
    // Stays open while deleting: the row disappears once the page refreshes.
    <form action={formAction} className="flex flex-wrap items-center gap-4">
      <input type="hidden" name="id" value={id} />
      <p role="alert" className="font-medium">
        {question}
      </p>
      <Button type="submit" disabled={pending}>
        Sí, borrar
      </Button>
      <Button variant="secondary" onClick={() => setAsking(false)}>
        Cancelar
      </Button>
    </form>
  );
}
