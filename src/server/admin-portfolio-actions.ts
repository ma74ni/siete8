"use server";

import "server-only";

import { redirect } from "next/navigation";

import {
  type FormState,
  idForm,
  imageFile,
  projectCoverForm,
  projectForm,
  projectImageForm,
  projectServicesForm,
  slugify,
} from "@/lib/admin-forms";
import {
  failed,
  INVALID,
  parse,
  refreshSite,
  removeImage,
  uploadImage,
} from "@/server/admin-action-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Panel writes of the portfolio (E4-04, E4-06). Every action checks the
// admin role, validates with Zod and writes as the signed-in user (RLS
// applies). Texts from docs/COPY.md §13.

const INVALID_IMAGE: FormState = {
  status: "error",
  message: "Elige una imagen JPEG, PNG, WebP o AVIF de hasta 2 MB.",
};

export async function saveProject(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  // An empty address is derived from the title.
  if (!String(formData.get("slug") ?? "").trim()) {
    formData.set("slug", slugify(String(formData.get("title") ?? "")));
  }
  const parsed = parse(projectForm, formData);
  if (!parsed.success) return INVALID;
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  if (id) {
    const { error } = await supabase
      .from("project")
      .update(fields)
      .eq("id", id);
    if (error) {
      return error.code === "23505"
        ? { status: "error", message: "Ya hay un proyecto con esa dirección." }
        : failed("guardar el proyecto");
    }
    refreshSite();
    return { status: "success", message: "Proyecto guardado." };
  }

  const { data, error } = await supabase
    .from("project")
    .insert(fields)
    .select("id")
    .single();
  if (error) {
    return error.code === "23505"
      ? { status: "error", message: "Ya hay un proyecto con esa dirección." }
      : failed("crear el proyecto");
  }
  refreshSite();
  redirect(`/admin/proyectos/${data.id}`);
}

export async function deleteProject(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("project")
    .delete()
    .eq("id", parsed.data.id)
    .select("cover_url, project_image(url)")
    .single();
  if (error) return failed("borrar el proyecto");
  await removeImage(supabase, data.cover_url);
  for (const image of data.project_image)
    await removeImage(supabase, image.url);
  refreshSite();
  redirect("/admin/proyectos");
}

/** Replaces the cover (shown on cards, decorative: the title is next to it). */
export async function saveProjectCover(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(projectCoverForm, formData);
  const file = imageFile.safeParse(formData.get("file"));
  if (!parsed.success) return INVALID;
  if (!file.success) return INVALID_IMAGE;

  const supabase = await createSessionClient();
  const { data: project } = await supabase
    .from("project")
    .select("cover_url")
    .eq("id", parsed.data.project_id)
    .single();
  const url = await uploadImage(supabase, "projects", file.data);
  if (!url) return failed("subir la imagen");
  const { error } = await supabase
    .from("project")
    .update({ cover_url: url })
    .eq("id", parsed.data.project_id);
  if (error) {
    await removeImage(supabase, url);
    return failed("guardar la portada");
  }
  await removeImage(supabase, project?.cover_url ?? null);
  refreshSite();
  return { status: "success", message: "Portada guardada." };
}

/** Adds a gallery image; the alt text is required (E4-04, RNF-12). */
export async function addProjectImage(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(projectImageForm, formData);
  const file = imageFile.safeParse(formData.get("file"));
  if (!parsed.success) return INVALID;
  if (!file.success) return INVALID_IMAGE;

  const supabase = await createSessionClient();
  const url = await uploadImage(supabase, "projects", file.data);
  if (!url) return failed("subir la imagen");
  const { error } = await supabase
    .from("project_image")
    .insert({ ...parsed.data, url });
  if (error) {
    await removeImage(supabase, url);
    return failed("guardar la imagen");
  }
  refreshSite();
  return { status: "success", message: "Imagen agregada." };
}

export async function deleteProjectImage(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("project_image")
    .delete()
    .eq("id", parsed.data.id)
    .select("url")
    .single();
  if (error) return failed("borrar la imagen");
  await removeImage(supabase, data.url);
  refreshSite();
  return { status: "success", message: "Imagen borrada." };
}

export async function saveProjectServices(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = projectServicesForm.safeParse({
    project_id: formData.get("project_id"),
    service_ids: formData.getAll("service_ids"),
  });
  if (!parsed.success) return INVALID;
  const { project_id, service_ids } = parsed.data;

  const supabase = await createSessionClient();
  const { error: deleteError } = await supabase
    .from("project_service")
    .delete()
    .eq("project_id", project_id);
  if (deleteError) return failed("guardar los servicios");
  if (service_ids.length > 0) {
    const { error } = await supabase
      .from("project_service")
      .insert(service_ids.map((service_id) => ({ project_id, service_id })));
    if (error) return failed("guardar los servicios");
  }
  refreshSite();
  return { status: "success", message: "Servicios guardados." };
}
