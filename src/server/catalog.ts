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

export type ServicePage = {
  name: string;
  slug: string;
  summary: string | null;
  requirementsIntro: string | null;
  closingTitle: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: { name: string; slug: string };
  plans: (PlanSummary & {
    holderType: HolderType;
    requirements: { text: string; required: boolean; sortOrder: number }[];
  })[];
  steps: string[];
  faqs: { question: string; answer: string }[];
  /** Null when there is none or the target service is hidden. */
  crossSell: { name: string; slug: string; text: string; cta: string } | null;
};

/**
 * Everything the page of a service needs, or null if the service does not
 * exist or is hidden (RF-ADM-12: the page answers 404). RLS limits the
 * anonymous client to visible rows, so a hidden cross-sell target is null.
 */
export async function getServicePage(
  slug: string,
): Promise<ServicePage | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("service")
    .select(
      `name, slug, summary, requirements_intro, closing_title, seo_title, seo_description,
       cross_sell_text, cross_sell_cta,
       category(name, slug, visible),
       related:related_service_id(name, slug, visible),
       plan(id, name, holder_type, price_without_vat, vat_rate, recommended, sort_order, visible,
            requirement(text, required, sort_order)),
       service_step(body, sort_order),
       service_faq(question, answer, sort_order)`,
    )
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();

  if (error)
    throw new Error(`Could not load service ${slug}: ${error.message}`);
  if (!data || !data.category?.visible) return null;

  const byOrder = (a: { sort_order: number }, b: { sort_order: number }) =>
    a.sort_order - b.sort_order;
  // Embedded through the column: `service!related_service_id` would return
  // the reverse relationship (services that point to this one).
  const related = data.related;

  return {
    name: data.name,
    slug: data.slug,
    summary: data.summary,
    requirementsIntro: data.requirements_intro,
    closingTitle: data.closing_title,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    category: { name: data.category.name, slug: data.category.slug },
    plans: data.plan
      .filter((plan) => plan.visible)
      .sort(byOrder)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        holderType: plan.holder_type,
        priceWithoutVat: plan.price_without_vat,
        vatRate: plan.vat_rate,
        recommended: plan.recommended,
        sortOrder: plan.sort_order,
        requirements: plan.requirement.map((item) => ({
          text: item.text,
          required: item.required,
          sortOrder: item.sort_order,
        })),
      })),
    steps: [...data.service_step].sort(byOrder).map((step) => step.body),
    faqs: [...data.service_faq]
      .sort(byOrder)
      .map(({ question, answer }) => ({ question, answer })),
    crossSell:
      related?.visible && data.cross_sell_text && data.cross_sell_cta
        ? {
            name: related.name,
            slug: related.slug,
            text: data.cross_sell_text,
            cta: data.cross_sell_cta,
          }
        : null,
  };
}

/** Slugs of the visible services, to prerender their pages. */
export async function getVisibleServiceSlugs(): Promise<string[]> {
  const catalog = await getServiceMenu();
  return catalog.flatMap((category) => category.services.map((s) => s.slug));
}
