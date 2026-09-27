/** A category of the catalog with its visible services, in panel order. */
export type MenuCategory = {
  name: string;
  slug: string;
  description: string | null;
  services: { name: string; slug: string; summary: string | null }[];
};

/** A category as read from the database, with every service it has. */
export type CatalogRow = {
  name: string;
  slug: string;
  description: string | null;
  visible: boolean;
  sort_order: number;
  service: {
    name: string;
    slug: string;
    summary: string | null;
    visible: boolean;
    sort_order: number;
  }[];
};

const byOrder = (a: { sort_order: number }, b: { sort_order: number }) =>
  a.sort_order - b.sort_order;

/**
 * Visible categories with their visible services, both in panel order
 * (RF-PUB-02). Categories left without visible services are dropped.
 */
export function visibleCatalog(rows: CatalogRow[]): MenuCategory[] {
  return rows
    .filter((category) => category.visible)
    .sort(byOrder)
    .map((category) => ({
      name: category.name,
      slug: category.slug,
      description: category.description,
      services: category.service
        .filter((service) => service.visible)
        .sort(byOrder)
        .map(({ name, slug, summary }) => ({ name, slug, summary })),
    }))
    .filter((category) => category.services.length > 0);
}

/** Main navigation (COPY §2), after Servicios. */
export const NAV_LINKS = [
  { label: "Proyectos", href: "/proyectos" },
  { label: "Blog", href: "/blog" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
] as const;
