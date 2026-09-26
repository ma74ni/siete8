import "server-only";

import type { Database } from "@/lib/database.types";
import type { MenuCategory } from "@/lib/menu";
import type { PlanSummary } from "@/lib/plans";
import { createPublicClient } from "@/server/supabase/public";

/**
 * Categories and services for the Servicios menu, in the order set in the
 * panel. RLS already limits the anonymous client to visible rows; the filters
 * here keep the menu right even if a policy changes. Empty categories are
 * left out.
 */
export async function getServiceMenu(): Promise<MenuCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("category")
    .select("name, slug, description, service(name, slug, sort_order, visible)")
    .eq("visible", true)
    .order("sort_order")
    .order("sort_order", { referencedTable: "service" });

  if (error)
    throw new Error(`Could not load the services menu: ${error.message}`);

  return data
    .map(({ service, ...category }) => ({
      ...category,
      services: service
        .filter((s) => s.visible)
        .map(({ name, slug }) => ({ name, slug })),
    }))
    .filter((category) => category.services.length > 0);
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
