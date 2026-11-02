import { adminPaths } from "@/lib/admin-paths";

// Texts from docs/COPY.md §13. The groups of DESIGN §12.2, rule 7 (E14-03).

export type AdminNavGroup = {
  /** The first group, Hoy alone, has no title. */
  title?: string;
  links: { label: string; href: string }[];
};

export const ADMIN_NAV: readonly AdminNavGroup[] = [
  { links: [{ label: "Hoy", href: adminPaths.home }] },
  {
    title: "Ventas",
    links: [
      { label: "Leads", href: adminPaths.leads },
      { label: "Clientes", href: adminPaths.clients },
      { label: "Por cobrar", href: adminPaths.owed },
      { label: "Por vencer", href: adminPaths.due },
    ],
  },
  {
    title: "Catálogo",
    links: [
      { label: "Servicios", href: adminPaths.services },
      { label: "Proyectos", href: adminPaths.projects },
      { label: "Blog", href: adminPaths.posts },
      { label: "Enlaces", href: adminPaths.links },
    ],
  },
  {
    title: "Finanzas",
    links: [
      { label: "Compras", href: adminPaths.purchases },
      { label: "Ganancias", href: adminPaths.profits },
    ],
  },
  {
    title: "Sitio",
    links: [
      { label: "Asistente", href: adminPaths.assistant },
      { label: "Configuración", href: adminPaths.settings },
    ],
  },
];

/**
 * Whether a panel address belongs to a side bar section. Hoy is only the
 * panel home; every other section owns the addresses under its own.
 */
export function isCurrentSection(pathname: string, href: string): boolean {
  if (href === adminPaths.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
