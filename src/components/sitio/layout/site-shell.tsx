import type { ReactNode } from "react";

import { Analytics } from "@/components/sitio/analytics";
import { Footer } from "@/components/sitio/layout/footer";
import { Header } from "@/components/sitio/layout/header";
import { WhatsAppButton } from "@/components/sitio/layout/whatsapp-button";
import { clientEnv } from "@/env/client";
import { getServiceMenu } from "@/server/catalog";

/**
 * Public site frame: header, content, footer and the floating WhatsApp
 * button. Used by the (sitio) layout and by the root 404 page, which renders
 * outside that group.
 */
export async function SiteShell({ children }: { children: ReactNode }) {
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
      {clientEnv.NEXT_PUBLIC_GA_ID && (
        <Analytics gaId={clientEnv.NEXT_PUBLIC_GA_ID} />
      )}
    </>
  );
}
