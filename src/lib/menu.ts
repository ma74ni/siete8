/** A category of the Servicios menu with its visible services, in order. */
export type MenuCategory = {
  name: string;
  slug: string;
  description: string | null;
  services: { name: string; slug: string }[];
};

/** Main navigation (COPY §2), after Servicios. */
export const NAV_LINKS = [
  { label: "Proyectos", href: "/proyectos" },
  { label: "Blog", href: "/blog" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
] as const;
