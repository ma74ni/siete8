import "server-only";

import type { MenuCategory } from "@/lib/menu";
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
