"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import {
  type FormState,
  formValues,
  idForm,
  planForm,
  serviceForm,
} from "@/lib/admin-forms";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Panel writes of the catalog (E4-02, E4-03). Every action checks the admin
// role, validates with Zod and writes as the signed-in user (RLS applies).
// Texts from docs/COPY.md §13.

const INVALID: FormState = {
  status: "error",
  message: "Revisa los campos marcados: hay datos que no son válidos.",
};

function failed(what: string): FormState {
  return {
    status: "error",
    message: `No se pudo ${what}. Inténtalo de nuevo; si sigue fallando, avísanos.`,
  };
}

/**
 * Every public page shows the catalog (the menu is in the layout), so a
 * change regenerates them all: it shows on the site without a deploy
 * (E3-09, RF-ADM-09).
 */
function refreshSite() {
  revalidatePath("/", "layout");
}

function parse<T extends z.ZodType>(schema: T, formData: FormData) {
  return schema.safeParse(formValues(formData));
}

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
