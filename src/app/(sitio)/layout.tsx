import type { ReactNode } from "react";

import { Footer } from "@/components/sitio/layout/footer";
import { Header } from "@/components/sitio/layout/header";
import { WhatsAppButton } from "@/components/sitio/layout/whatsapp-button";
import { getServiceMenu } from "@/server/catalog";

/** Public site: header, content, footer and the floating WhatsApp button. */
export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const categories = await getServiceMenu();

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-bg focus:px-4 focus:py-3"
      >
        Saltar al contenido
      </a>
      <Header categories={categories} />
      <main id="contenido" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
