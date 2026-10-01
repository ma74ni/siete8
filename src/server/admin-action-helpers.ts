import "server-only";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { type FormState, formValues } from "@/lib/admin-forms";
import type { createSessionClient } from "@/server/supabase/session";

// Shared by the panel's Server Actions. Texts from docs/COPY.md §13.

export const INVALID: FormState = {
  status: "error",
  message: "Revisa los campos marcados: hay datos que no son válidos.",
};

export function failed(what: string): FormState {
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
export function refreshSite() {
  revalidatePath("/", "layout");
  // Route handlers are outside the layout tree.
  revalidatePath("/blog/rss.xml");
}

export function parse<T extends z.ZodType>(schema: T, formData: FormData) {
  return schema.safeParse(formValues(formData));
}

type Supabase = Awaited<ReturnType<typeof createSessionClient>>;

const BUCKET = "images";
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Uploads an image to the public bucket (E1-08) under `posts/` or
 * `projects/` with a random name, and returns its public URL. The bucket
 * enforces type and size again on its side.
 */
export async function uploadImage(
  supabase: Supabase,
  folder: "posts" | "projects",
  file: File,
): Promise<string | null> {
  const path = `${folder}/${crypto.randomUUID()}.${EXTENSIONS[file.type] ?? "img"}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Removes a file uploaded by `uploadImage`; other URLs are left alone. */
export async function removeImage(supabase: Supabase, url: string | null) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url?.indexOf(marker) ?? -1;
  if (!url || index === -1) return;
  await supabase.storage
    .from(BUCKET)
    .remove([decodeURIComponent(url.slice(index + marker.length))]);
}
