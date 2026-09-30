import "server-only";

import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/**
 * Panel reads of the blog (E4-05). They run as the signed-in admin, whose
 * RLS policy sees drafts and scheduled articles too.
 */

export async function listPostsForAdmin() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("post")
    .select("id, title, status, published_at, cover_url, updated_at")
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not list posts: ${error.message}`);
  return data;
}

export async function getPostForAdmin(id: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [{ data, error }, { data: services, error: servicesError }] =
    await Promise.all([
      supabase
        .from("post")
        .select(
          `id, title, slug, excerpt, body_md, author_name, status, published_at,
           cover_url, seo_title, seo_description, updated_at, post_service(service_id)`,
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("service").select("id, name").order("name"),
    ]);
  if (error || servicesError) {
    throw new Error(
      `Could not load post ${id}: ${(error ?? servicesError)!.message}`,
    );
  }
  if (!data) return null;
  return {
    ...data,
    serviceId: data.post_service[0]?.service_id ?? null,
    allServices: services,
  };
}

/** Services to pick the related one from, for a new article. */
export async function listServiceOptions() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("service")
    .select("id, name")
    .order("name");
  if (error) throw new Error(`Could not list services: ${error.message}`);
  return data;
}

export type PostForAdmin = NonNullable<
  Awaited<ReturnType<typeof getPostForAdmin>>
>;
