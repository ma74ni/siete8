import type { MetadataRoute } from "next";

import { clientEnv } from "@/env/client";
import { getVisibleServiceSlugs } from "@/server/catalog";

const STATIC_PATHS = [
  "/",
  "/servicios",
  "/nosotros",
  "/contacto",
  "/privacidad",
  "/terminos",
];

/** Public pages; hidden services are left out (RNF-06). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getVisibleServiceSlugs();
  const paths = [...STATIC_PATHS, ...slugs.map((slug) => `/servicios/${slug}`)];
  return paths.map((path) => ({
    url: new URL(path, clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  }));
}
