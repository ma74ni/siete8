"use server";

import "server-only";

import { redirect } from "next/navigation";

import {
  type FormState,
  idForm,
  imageFile,
  postCoverForm,
  postForm,
  slugify,
} from "@/lib/admin-forms";
import { fromQuitoInput } from "@/lib/blog";
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

// Panel writes of the blog (E4-05). Every action checks the admin role,
// validates with Zod and writes as the signed-in user (RLS applies).
// Texts from docs/COPY.md §13.

const TAKEN: FormState = {
  status: "error",
  message: "Ya hay un artículo con esa dirección.",
};

export async function savePost(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  // An empty address is derived from the title.
  if (!String(formData.get("slug") ?? "").trim()) {
    formData.set("slug", slugify(String(formData.get("title") ?? "")));
  }
  const parsed = parse(postForm, formData);
  if (!parsed.success) return INVALID;
  const { id, service_id, published_at, ...fields } = parsed.data;

  // Publishing without a date means now; a future date schedules it.
  const row = {
    ...fields,
    published_at: published_at
      ? fromQuitoInput(published_at)
      : fields.status === "published"
        ? new Date().toISOString()
        : null,
  };

  const supabase = await createSessionClient();
  let postId = id;
  if (id) {
    const { error } = await supabase.from("post").update(row).eq("id", id);
    if (error)
      return error.code === "23505" ? TAKEN : failed("guardar el artículo");
  } else {
    const { data, error } = await supabase
      .from("post")
      .insert({ ...row, author_id: admin.id })
      .select("id")
      .single();
    if (error)
      return error.code === "23505" ? TAKEN : failed("crear el artículo");
    postId = data.id;
  }

  // One related service (RF-BLG-03), or none.
  const { error: unlinkError } = await supabase
    .from("post_service")
    .delete()
    .eq("post_id", postId!);
  if (unlinkError) return failed("guardar el servicio relacionado");
  if (service_id) {
    const { error: linkError } = await supabase
      .from("post_service")
      .insert({ post_id: postId!, service_id });
    if (linkError) return failed("guardar el servicio relacionado");
  }

  refreshSite();
  if (!id) redirect(`/admin/blog/${postId}`);
  return { status: "success", message: "Artículo guardado." };
}

export async function deletePost(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("post")
    .delete()
    .eq("id", parsed.data.id)
    .select("cover_url")
    .single();
  if (error) return failed("borrar el artículo");
  await removeImage(supabase, data.cover_url);
  refreshSite();
  redirect("/admin/blog");
}

/** Replaces the cover: shown on top of the article and as its link preview. */
export async function savePostCover(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(postCoverForm, formData);
  const file = imageFile.safeParse(formData.get("file"));
  if (!parsed.success) return INVALID;
  if (!file.success) {
    return {
      status: "error",
      message: "Elige una imagen JPEG, PNG, WebP o AVIF de hasta 2 MB.",
    };
  }

  const supabase = await createSessionClient();
  const { data: post } = await supabase
    .from("post")
    .select("cover_url")
    .eq("id", parsed.data.post_id)
    .single();
  const url = await uploadImage(supabase, "posts", file.data);
  if (!url) return failed("subir la imagen");
  const { error } = await supabase
    .from("post")
    .update({ cover_url: url })
    .eq("id", parsed.data.post_id);
  if (error) {
    await removeImage(supabase, url);
    return failed("guardar la portada");
  }
  await removeImage(supabase, post?.cover_url ?? null);
  refreshSite();
  return { status: "success", message: "Portada guardada." };
}
