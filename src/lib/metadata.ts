import type { Metadata } from "next";

/** Shared image for link previews on social networks and WhatsApp. */
const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Siete8: sitios web, hosting, firma electrónica y facturación en Quito. Escríbenos por WhatsApp al 0961128233.",
};

/**
 * Metadata of a public page (title, description, canonical, Open Graph and
 * Twitter Card). Next merges segments shallowly, so each page repeats the
 * whole `openGraph` object here instead of inheriting it from the layout.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string;
  description?: string;
  path: string;
  /** Own preview image (a project or article cover); default: og.png. */
  image?: { url: string; alt: string } | null;
  type?: "website" | "article";
}): Metadata {
  const images = image ? [image] : [OG_IMAGE];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Siete8",
      locale: "es_EC",
      type,
      images,
    },
    twitter: { card: "summary_large_image", images },
  };
}
