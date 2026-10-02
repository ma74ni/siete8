"use server";

import "server-only";

import type { FormState } from "@/lib/admin-forms";
import { assistantForm } from "@/lib/assistant";
import {
  failed,
  INVALID,
  parse,
  refreshSite,
} from "@/server/admin-action-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Assistant settings (E10, RF-AST-09, RF-ADM-08). Texts from docs/COPY.md §13.

export async function saveAssistant(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(assistantForm, formData);
  if (!parsed.success) return INVALID;
  const form = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase.from("site_settings").upsert(
    [
      // Public: every page decides whether to show the chat.
      { key: "assistant_enabled", value: form.enabled, is_public: true },
      {
        key: "assistant",
        value: { prompt: form.prompt, monthly_budget_usd: form.budget },
        is_public: false,
      },
    ],
    { onConflict: "key" },
  );
  if (error) return failed("guardar el asistente");
  refreshSite();
  return {
    status: "success",
    message: form.enabled
      ? "Asistente guardado y activado."
      : "Asistente guardado. Está apagado.",
  };
}
