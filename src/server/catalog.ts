import "server-only";

import type { Database } from "@/lib/database.types";
import { visibleCatalog, type MenuCategory } from "@/lib/menu";
import type { PlanSummary } from "@/lib/plans";
import { createPublicClient } from "@/server/supabase/public";

/**
 * The service catalog: visible categories and services in the order set in
 * the panel, for the Servicios menu and the /servicios page. RLS already
 * limits the anonymous client to visible rows; `visibleCatalog` filters again
 * so the catalog stays right even if a policy changes.
 */
export async function getServiceMenu(): Promise<MenuCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("category")
    .select(
      "name, slug, description, visible, sort_order, service(name, slug, summary, visible, sort_order)",
    );

  if (error)
    throw new Error(`Could not load the services menu: ${error.message}`);

  return visibleCatalog(data);
}

type HolderType = Database["public"]["Enums"]["holder_type"];

export type ServicePlans = {
  name: string;
  slug: string;
  plans: (PlanSummary & { holderType: HolderType })[];
};

/** A visible service with its visible plans, in panel order; null if hidden. */
export async function getServicePlans(
  slug: string,
): Promise<ServicePlans | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("service")
    .select(
      "name, slug, plan(id, name, holder_type, price_without_vat, vat_rate, recommended, sort_order, visible)",
    )
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();

  if (error)
    throw new Error(`Could not load service ${slug}: ${error.message}`);
  if (!data) return null;

  return {
    name: data.name,
    slug: data.slug,
    plans: data.plan
      .filter((plan) => plan.visible)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        holderType: plan.holder_type,
        priceWithoutVat: plan.price_without_vat,
        vatRate: plan.vat_rate,
        recommended: plan.recommended,
        sortOrder: plan.sort_order,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}
