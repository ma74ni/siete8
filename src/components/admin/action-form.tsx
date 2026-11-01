"use client";

import {
  Fragment,
  type ReactNode,
  useActionState,
  useEffect,
  useRef,
} from "react";

import Link from "next/link";

import { Button } from "@/components/sitio/button";
import { type FormState, IDLE } from "@/lib/admin-forms";
import { cx } from "@/lib/cx";
import { isChoice, restoredField } from "@/lib/form-restore";

type ActionFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  /** Says what happens, e.g. "Guardar plan" (the message repeats the verb). */
  submitLabel: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
  className?: string;
  /**
   * Changes when the record is saved (e.g. its `updated_at`). The fields
   * remount with the saved values: React resets a form after its action, and
   * selects and checkboxes would otherwise go back to the first render.
   */
  resetKey?: string;
  /**
   * On a form page (E14-02), where "Cancelar" goes: back to the record
   * without saving. Texts from docs/COPY.md §13 (Panel: comunes).
   */
  cancelHref?: string;
  children?: ReactNode;
};

/**
 * Panel form backed by a Server Action (E4-01). The result shows next to the
 * button with the same verb as the action ("Guardar" → "Plan guardado.").
 * After an error the fields keep what was typed (E13-01): React clears them
 * when the action finishes, so they are filled back from what was sent.
 */
export function ActionForm({
  action,
  submitLabel,
  pendingLabel = "Guardando…",
  variant = "primary",
  className,
  resetKey,
  cancelHref,
  children,
}: ActionFormProps) {
  const form = useRef<HTMLFormElement>(null);
  const sent = useRef<FormData | null>(null);
  const [state, formAction, pending] = useActionState(
    (previous: FormState, formData: FormData) => {
      sent.current = formData;
      return action(previous, formData);
    },
    IDLE,
  );

  useEffect(() => {
    if (state.status !== "error" || !form.current || !sent.current) return;
    // Fields sharing a name (rows of a list) each get their own value back.
    const seen = new Map<string, number>();
    for (const field of Array.from(form.current.elements)) {
      if (
        !(field instanceof HTMLInputElement) &&
        !(field instanceof HTMLTextAreaElement) &&
        !(field instanceof HTMLSelectElement)
      ) {
        continue;
      }
      const position = seen.get(field.name) ?? 0;
      if (!field.disabled && !isChoice(field)) {
        seen.set(field.name, position + 1);
      }
      const restored = restoredField(field, sent.current, position);
      if (restored && "checked" in restored) {
        if (field instanceof HTMLInputElement) field.checked = restored.checked;
      } else if (restored) {
        field.value = restored.value;
      }
    }
  }, [state]);

  return (
    <form
      ref={form}
      action={formAction}
      className={cx("flex flex-col gap-4", className)}
    >
      <Fragment key={resetKey}>{children}</Fragment>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant={variant} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        {cancelHref && (
          <Link href={cancelHref} className="inline-flex min-h-12 items-center">
            Cancelar
          </Link>
        )}
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
