import "server-only";

import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/**
 * Panel reads of the portfolio (E4-06). They run as the signed-in admin,
 * whose RLS policy sees unpublished projects too.
 */

const byOrder = (a: { sort_order: number }, b: { sort_order: number }) =>
  a.sort_order - b.sort_order;

export async function listProjectsForAdmin() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("project")
    .select("id, title, status, published, featured, sort_order, cover_url")
    .order("sort_order")
    .order("title");
  if (error) throw new Error(`Could not list projects: ${error.message}`);
  return data;
}

export async function getProjectForAdmin(id: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [{ data, error }, { data: services, error: servicesError }] =
    await Promise.all([
      supabase
        .from("project")
        .select(
          `id, title, slug, status, client_name, show_client_name, sector, year,
           summary, challenge_md, solution_md, results_md, tech_stack, cover_url,
           live_url, featured, published, sort_order,
           project_image(id, url, alt, device, sort_order),
           project_service(service_id)`,
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("service").select("id, name").order("name"),
    ]);
  if (error || servicesError) {
    throw new Error(
      `Could not load project ${id}: ${(error ?? servicesError)!.message}`,
    );
  }
  if (!data) return null;
  return {
    ...data,
    project_image: [...data.project_image].sort(byOrder),
    serviceIds: data.project_service.map((link) => link.service_id),
    allServices: services,
  };
}

export type ProjectForAdmin = NonNullable<
  Awaited<ReturnType<typeof getProjectForAdmin>>
>;
