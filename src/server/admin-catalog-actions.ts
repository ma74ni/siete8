"use server";

import "server-only";

import {
  faqForm,
  type FormState,
  holderNoteForm,
  idForm,
  planForm,
  requirementsForm,
  serviceForm,
  stepForm,
} from "@/lib/admin-forms";
import {
  failed,
  INVALID,
  parse,
  refreshSite,
} from "@/server/admin-action-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Panel writes of the catalog (E4-02, E4-03). Every action checks the admin
// role, validates with Zod and writes as the signed-in user (RLS applies).
// Texts from docs/COPY.md §13.

export async function updateService(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(serviceForm, formData);
  if (!parsed.success) return INVALID;
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase.from("service").update(fields).eq("id", id);
  if (error) return failed("guardar el servicio");
  refreshSite();
  return { status: "success", message: "Servicio guardado." };
}

export async function savePlan(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(planForm, formData);
  if (!parsed.success) return INVALID;
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = id
    ? await supabase.from("plan").update(fields).eq("id", id)
    : await supabase.from("plan").insert(fields);
  if (error) return failed("guardar el plan");
  refreshSite();
  return {
    status: "success",
    message: id ? "Plan guardado." : "Plan agregado.",
  };
}

export async function deletePlan(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("plan")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failed("borrar el plan");
  refreshSite();
  return { status: "success", message: "Plan borrado." };
}

/**
 * Replaces the requirements of every plan of one holder type (the database
 * repeats the list per plan). New rows go in first and the old ones are
 * removed after, so a failure never leaves the service without requirements.
 * A text that already existed keeps its required flag; a new one is required.
 */
export async function saveRequirements(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(requirementsForm, formData);
  if (!parsed.success) return INVALID;
  const { service_id, holder_type, items } = parsed.data;

  const supabase = await createSessionClient();
  const { data: plans, error } = await supabase
    .from("plan")
    .select("id, requirement(id, text, required)")
    .eq("service_id", service_id)
    .eq("holder_type", holder_type);
  if (error) return failed("guardar los requisitos");
  if (plans.length === 0) {
    return {
      status: "error",
      message: "Agrega primero un plan de este tipo de titular.",
    };
  }

  const required = new Map<string, boolean>();
  for (const plan of plans) {
    for (const item of plan.requirement) {
      required.set(
        item.text,
        (required.get(item.text) ?? false) || item.required,
      );
    }
  }
  const rows = plans.flatMap((plan) =>
    items.map((text, index) => ({
      plan_id: plan.id,
      text,
      required: required.get(text) ?? true,
      sort_order: index + 1,
    })),
  );
  const oldIds = plans.flatMap((plan) =>
    plan.requirement.map((item) => item.id),
  );

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("requirement")
      .insert(rows);
    if (insertError) return failed("guardar los requisitos");
  }
  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("requirement")
      .delete()
      .in("id", oldIds);
    if (deleteError) return failed("guardar los requisitos");
  }
  refreshSite();
  return { status: "success", message: "Requisitos guardados." };
}

export async function saveStep(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(stepForm, formData);
  if (!parsed.success) return INVALID;
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = id
    ? await supabase.from("service_step").update(fields).eq("id", id)
    : await supabase.from("service_step").insert(fields);
  if (error) return failed("guardar el paso");
  refreshSite();
  return {
    status: "success",
    message: id ? "Paso guardado." : "Paso agregado.",
  };
}

export async function deleteStep(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("service_step")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failed("borrar el paso");
  refreshSite();
  return { status: "success", message: "Paso borrado." };
}

export async function saveFaq(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(faqForm, formData);
  if (!parsed.success) return INVALID;
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = id
    ? await supabase.from("service_faq").update(fields).eq("id", id)
    : await supabase.from("service_faq").insert(fields);
  if (error) return failed("guardar la pregunta");
  refreshSite();
  return {
    status: "success",
    message: id ? "Pregunta guardada." : "Pregunta agregada.",
  };
}

export async function deleteFaq(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("service_faq")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failed("borrar la pregunta");
  refreshSite();
  return { status: "success", message: "Pregunta borrada." };
}

/** Saves the note under one tab of plans; an empty note removes it. */
export async function saveHolderNote(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(holderNoteForm, formData);
  if (!parsed.success) return INVALID;
  const { service_id, holder_type, body } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = body
    ? await supabase
        .from("service_holder_note")
        .upsert(
          { service_id, holder_type, body },
          { onConflict: "service_id,holder_type" },
        )
    : await supabase
        .from("service_holder_note")
        .delete()
        .eq("service_id", service_id)
        .eq("holder_type", holder_type);
  if (error) return failed("guardar el aviso");
  refreshSite();
  return {
    status: "success",
    message: body ? "Aviso guardado." : "Aviso quitado.",
  };
}
