import type { MetadataRoute } from "next";

import { clientEnv } from "@/env/client";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/dev"] },
    sitemap: new URL("/sitemap.xml", clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  };
}
