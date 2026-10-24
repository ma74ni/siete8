"use server";

import "server-only";

import {
  type FormState,
  idForm,
  leadAdminForm,
  proformaForm,
} from "@/lib/admin-forms";
import {
  failed,
  INVALID,
  parse,
  PROFORMA_DECIDED,
  refreshLeads,
} from "@/server/admin-action-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Panel writes of the leads (E4-07) and their proformas (E11-05). The status
// history is written by a database trigger (lead_status_event); sending a
// proforma moves the lead to "Proforma enviada" in another one. Accepting a
// proforma creates a client: see acceptProforma in admin-clients-actions.
// Texts from docs/COPY.md §13.

export async function saveLead(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(leadAdminForm, formData);
  if (!parsed.success) {
    return parsed.error.issues.some((issue) => issue.path[0] === "lost_reason")
      ? { status: "error", message: "Escribe el motivo: ¿por qué se perdió?" }
      : INVALID;
  }
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase.from("lead").update(fields).eq("id", id);
  if (error) return failed("guardar el lead");
  refreshLeads();
  return { status: "success", message: "Lead guardado." };
}

/** "Registrar proforma" (RF-CRM-19). */
export async function createProforma(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(proformaForm, formData);
  if (!parsed.success) {
    return parsed.error.issues.some(
      (issue) => issue.path[0] === "price_without_vat",
    )
      ? {
          status: "error",
          message: "Escribe el precio ofrecido: no puede ser 0.",
        }
      : INVALID;
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.from("proforma").insert(parsed.data);
  if (error) return failed("registrar la proforma");
  refreshLeads();
  return { status: "success", message: "Proforma registrada." };
}

/** "Rechazar": only a sent proforma; the lead keeps its status. */
export async function rejectProforma(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("proforma")
    .update({ status: "rejected" })
    .eq("id", parsed.data.id)
    .eq("status", "sent")
    .select("id");
  if (error) return failed("rechazar la proforma");
  if (data.length === 0) return PROFORMA_DECIDED;
  refreshLeads();
  return { status: "success", message: "Proforma rechazada." };
}
