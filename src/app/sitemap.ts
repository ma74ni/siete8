import type { MetadataRoute } from "next";

import { clientEnv } from "@/env/client";
import { getVisibleServiceSlugs } from "@/server/catalog";
import { getPublishedPostSlugs } from "@/server/blog";
import { getPublishedProjectSlugs } from "@/server/portfolio";

const STATIC_PATHS = [
  "/",
  "/servicios",
  "/nosotros",
  "/contacto",
  "/privacidad",
  "/terminos",
];

/** Public pages; hidden services, unpublished projects and drafts are left out (RNF-06). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, posts] = await Promise.all([
    getVisibleServiceSlugs(),
    getPublishedProjectSlugs(),
    getPublishedPostSlugs(),
  ]);
  const paths = [
    ...STATIC_PATHS,
    ...services.map((slug) => `/servicios/${slug}`),
    ...(projects.length > 0 ? ["/proyectos"] : []),
    ...projects.map((slug) => `/proyectos/${slug}`),
    ...(posts.length > 0 ? ["/blog"] : []),
    ...posts.map((slug) => `/blog/${slug}`),
  ];
  return paths.map((path) => ({
    url: new URL(path, clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  }));
}
