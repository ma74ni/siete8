import Link from "next/link";

import { CookieSettingsButton } from "@/components/sitio/analytics";
import { Logo } from "@/components/sitio/logo";
import { clientEnv } from "@/env/client";
import { cx } from "@/lib/cx";
import { navLinks, type PublishedSections } from "@/lib/menu";
import { type SiteSettings, toTel } from "@/lib/site-settings";

// Texts from docs/COPY.md §2.

/** Quiet links: white on ink, underlined on hover; 44 px tall on phones. */
const link =
  "inline-flex min-h-11 items-center text-fg no-underline hover:underline lg:min-h-0 lg:py-1";

function Column({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <h2 className="text-small font-medium text-fg-muted">{title}</h2>
      {children}
    </div>
  );
}

/**
 * Site footer on the `ink` floor (DESIGN §5.1), compact: brand, contact,
 * site links and social networks, then the copyright and the legal links.
 * Contact and networks come from the site settings (E4-08). The bottom
 * padding leaves room for the floating WhatsApp button.
 */
export function Footer({
  published,
  settings,
}: {
  published: PublishedSections;
  settings: SiteSettings;
}) {
  const pages = [
    { label: "Servicios", href: "/servicios" },
    ...navLinks(published),
  ];
  // The phone is only listed when it is not the WhatsApp number itself.
  const separatePhone = settings.phone !== settings.whatsapp.number;

  return (
    <footer className="on-ink text-small">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-12">
        {/* Phones: brand and contact full width, then Sitio and Redes side
            by side. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border py-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
            <Link
              href="/"
              aria-label="Siete8, inicio"
              className="self-start text-fg"
            >
              <Logo className="h-8 w-auto" />
            </Link>
            <p>Soluciones tecnológicas para personas y negocios pequeños.</p>
          </div>
          <Column title="Contacto" className="col-span-2 lg:col-span-1">
            <address className="flex flex-col not-italic">
              <a
                href={`tel:${toTel(settings.whatsapp.number)}`}
                className={link}
              >
                WhatsApp: {settings.whatsapp.number}
              </a>
              {separatePhone && (
                <a href={`tel:${toTel(settings.phone)}`} className={link}>
                  Teléfono: {settings.phone}
                </a>
              )}
              <a href={`mailto:${settings.email}`} className={link}>
                {settings.email}
              </a>
              <span className="inline-flex min-h-11 items-center lg:min-h-0 lg:py-1">
                Quito, Ecuador
              </span>
            </address>
          </Column>
          <Column title="Sitio">
            <ul className="flex flex-col">
              {pages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={link}>
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>
          {settings.social.length > 0 && (
            <Column title="Redes">
              <ul className="flex flex-col">
                {settings.social.map((network) => (
                  <li key={network.url}>
                    <a href={network.url} className={link}>
                      {network.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Column>
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-4 pb-28 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Siete8. Todos los derechos reservados.
          </p>
          <ul className="flex flex-wrap gap-x-6">
            <li>
              <Link href="/privacidad" className={link}>
                Privacidad
              </Link>
            </li>
            <li>
              <Link href="/terminos" className={link}>
                Términos
              </Link>
            </li>
            {clientEnv.NEXT_PUBLIC_GA_ID && (
              <li>
                <CookieSettingsButton
                  className={`${link} cursor-pointer text-left`}
                />
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
