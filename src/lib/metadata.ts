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
}: {
  title: string;
  description?: string;
  path: string;
}): Metadata {
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
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE] },
  };
}
