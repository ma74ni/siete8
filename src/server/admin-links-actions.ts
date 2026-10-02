"use server";

import "server-only";

import { type FormState, idForm, linkButtonForm } from "@/lib/admin-forms";
import {
  failed,
  INVALID,
  parse,
  refreshSite,
} from "@/server/admin-action-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Buttons of the links page (/enlaces). Texts from docs/COPY.md §13.

export async function saveLinkButton(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(linkButtonForm, formData);
  if (!parsed.success) return INVALID;
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = id
    ? await supabase.from("link_button").update(fields).eq("id", id)
    : await supabase.from("link_button").insert(fields);
  if (error) return failed("guardar el botón");
  refreshSite();
  return {
    status: "success",
    message: id ? "Botón guardado." : "Botón agregado.",
  };
}

export async function deleteLinkButton(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("link_button")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failed("borrar el botón");
  refreshSite();
  return { status: "success", message: "Botón borrado." };
}
