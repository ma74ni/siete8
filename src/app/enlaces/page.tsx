import type { Metadata } from "next";
import Link from "next/link";

import { Analytics } from "@/components/sitio/analytics";
import { CampaignCapture } from "@/components/sitio/campaign-capture";
import { Logo } from "@/components/sitio/logo";
import { clientEnv } from "@/env/client";
import { cx } from "@/lib/cx";
import { pageMetadata } from "@/lib/metadata";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";
import { getLatestPost } from "@/server/blog";
import { getLinkButtons } from "@/server/links";
import { getSiteSettings } from "@/server/site-settings";

// Texts from docs/COPY.md §17. Outside the (sitio) group on purpose: a
// "link in bio" page has no menu or footer, only the buttons.

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Enlaces | Siete8",
  description:
    "Escríbenos por WhatsApp, conoce nuestros servicios o lee el blog de Siete8.",
  path: "/enlaces",
});

type LinkItem = {
  id: string;
  href: string;
  highlight: boolean;
  /** Small text above, e.g. "Del blog" over the article's title. */
  caption: string | null;
  text: string;
};

const button =
  "flex min-h-14 w-full items-center justify-center rounded-control px-5 py-3 text-center font-medium no-underline transition-colors duration-150 ease-out";

/**
 * Links page for the social networks' bio (siete8.com/enlaces). Buttons come
 * from the panel; WhatsApp uses the number in the site settings, and the
 * latest article button only shows when there is one. Visits keep their UTM
 * (CampaignCapture) so GA credits each network.
 */
export default async function LinksPage() {
  const [buttons, settings, post] = await Promise.all([
    getLinkButtons(),
    getSiteSettings(),
    getLatestPost(),
  ]);

  const items = buttons.flatMap((item): LinkItem[] => {
    if (item.kind === "whatsapp") {
      return [
        {
          ...item,
          href: whatsappUrl(generalMessage(), settings.whatsapp.waMe),
          caption: null,
          text: item.label,
        },
      ];
    }
    if (item.kind === "latest_post") {
      return post
        ? [
            {
              ...item,
              href: `/blog/${post.slug}`,
              caption: item.label,
              text: post.title,
            },
          ]
        : [];
    }
    return item.url
      ? [{ ...item, href: item.url, caption: null, text: item.label }]
      : [];
  });

  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col items-center gap-8 px-5 py-12"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Link href="/" aria-label="Siete8, inicio" className="text-fg">
          <Logo className="h-12 w-auto" />
        </Link>
        <p>Soluciones tecnológicas para personas y negocios pequeños.</p>
      </div>
      <ul className="flex w-full flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cx(
                button,
                item.highlight
                  ? "bg-action text-on-action hover:bg-action-hover"
                  : "border-[1.5px] border-fg text-fg hover:bg-surface",
                item.caption && "flex-col gap-0.5",
              )}
            >
              {item.caption && (
                <span className="text-small font-normal">{item.caption}</span>
              )}
              <span>{item.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      {settings.social.length > 0 && (
        <ul
          aria-label="Redes sociales"
          className="flex flex-wrap justify-center gap-x-6 gap-y-2"
        >
          {settings.social.map((network) => (
            <li key={network.url}>
              <a
                href={network.url}
                className="inline-flex min-h-11 items-center"
              >
                {network.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-auto text-small">
        <Link href="/">siete8.com</Link>
      </p>
      <CampaignCapture />
      {clientEnv.NEXT_PUBLIC_GA_ID && (
        <Analytics
          gaId={clientEnv.NEXT_PUBLIC_GA_ID}
          siteUrl={clientEnv.NEXT_PUBLIC_SITE_URL}
        />
      )}
    </main>
  );
}
