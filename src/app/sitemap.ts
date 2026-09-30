import type { MetadataRoute } from "next";

import { clientEnv } from "@/env/client";
import { getVisibleServiceSlugs } from "@/server/catalog";
import { getPublishedProjectSlugs } from "@/server/portfolio";

const STATIC_PATHS = [
  "/",
  "/servicios",
  "/nosotros",
  "/contacto",
  "/privacidad",
  "/terminos",
];

/** Public pages; hidden services and unpublished projects are left out (RNF-06). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects] = await Promise.all([
    getVisibleServiceSlugs(),
    getPublishedProjectSlugs(),
  ]);
  const paths = [
    ...STATIC_PATHS,
    ...services.map((slug) => `/servicios/${slug}`),
    ...(projects.length > 0 ? ["/proyectos"] : []),
    ...projects.map((slug) => `/proyectos/${slug}`),
  ];
  return paths.map((path) => ({
    url: new URL(path, clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  }));
}
