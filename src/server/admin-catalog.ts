import "server-only";

import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/**
 * Panel reads of the catalog (E4-02, E4-03). They run as the signed-in admin,
 * whose RLS policy sees hidden rows too.
 */

export async function listServicesForAdmin() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("category")
    .select(
      "id, name, sort_order, visible, service(id, name, slug, visible, sort_order, plan(id))",
    )
    .order("sort_order");
  if (error) throw new Error(`Could not list services: ${error.message}`);
  return data.map((category) => ({
    ...category,
    service: [...category.service].sort((a, b) => a.sort_order - b.sort_order),
  }));
}

const byOrder = (a: { sort_order: number }, b: { sort_order: number }) =>
  a.sort_order - b.sort_order;

export async function getServiceForAdmin(id: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [{ data, error }, { data: others, error: othersError }] =
    await Promise.all([
      supabase
        .from("service")
        .select(
          `id, name, slug, visible, summary, requirements_intro, closing_title,
           seo_title, seo_description, related_service_id, cross_sell_text, cross_sell_cta,
           category(name),
           plan(id, name, holder_type, price_without_vat, vat_rate, visible, recommended, sort_order,
                requirement(text, required, sort_order)),
           service_step(id, body, sort_order),
           service_faq(id, question, answer, sort_order),
           service_holder_note(holder_type, body)`,
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("service").select("id, name").neq("id", id).order("name"),
    ]);
  if (error || othersError) {
    throw new Error(
      `Could not load service ${id}: ${(error ?? othersError)!.message}`,
    );
  }
  if (!data) return null;
  return {
    ...data,
    plan: [...data.plan].sort(byOrder),
    service_step: [...data.service_step].sort(byOrder),
    service_faq: [...data.service_faq].sort(byOrder),
    otherServices: others,
  };
}

export type ServiceForAdmin = NonNullable<
  Awaited<ReturnType<typeof getServiceForAdmin>>
>;
