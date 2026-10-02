import type { ReactNode } from "react";

import { Analytics } from "@/components/sitio/analytics";
import { CampaignCapture } from "@/components/sitio/campaign-capture";
import { AssistantChat } from "@/components/sitio/layout/assistant-chat";
import { Footer } from "@/components/sitio/layout/footer";
import { Header } from "@/components/sitio/layout/header";
import { WhatsAppButton } from "@/components/sitio/layout/whatsapp-button";
import { clientEnv } from "@/env/client";
import { navLinks } from "@/lib/menu";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";
import { isAssistantAvailable } from "@/server/assistant";
import { getServiceMenu } from "@/server/catalog";
import { getPublishedSections } from "@/server/published";
import { getSiteSettings } from "@/server/site-settings";

/**
 * Public site frame: header, content, footer and one floating button: the
 * assistant when it is on (E10), otherwise WhatsApp. Used by the (sitio) layout and by the root 404 page, which renders
 * outside that group.
 */
export async function SiteShell({ children }: { children: ReactNode }) {
  const [categories, published, settings] = await Promise.all([
    getServiceMenu(),
    getPublishedSections(),
    getSiteSettings(),
  ]);
  const whatsappHref = whatsappUrl(generalMessage(), settings.whatsapp.waMe);
  const siteKey = clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const assistant = siteKey && (await isAssistantAvailable(settings));

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-bg focus:px-4 focus:py-3"
      >
        Saltar al contenido
      </a>
      <Header
        categories={categories}
        links={navLinks(published)}
        whatsappHref={whatsappHref}
      />
      <main id="contenido" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer published={published} settings={settings} />
      {assistant ? (
        <AssistantChat siteKey={siteKey} whatsappHref={whatsappHref} />
      ) : (
        <WhatsAppButton href={whatsappHref} />
      )}
      <CampaignCapture />
      {clientEnv.NEXT_PUBLIC_GA_ID && (
        <Analytics
          gaId={clientEnv.NEXT_PUBLIC_GA_ID}
          siteUrl={clientEnv.NEXT_PUBLIC_SITE_URL}
        />
      )}
    </>
  );
}
