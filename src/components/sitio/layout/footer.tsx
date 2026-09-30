import Link from "next/link";

import { CookieSettingsButton } from "@/components/sitio/analytics";
import { clientEnv } from "@/env/client";
import { SOCIAL_LINKS } from "@/lib/social";

// COPY §2. Proyectos and Blog join once their pages exist.
const links = [
  { label: "Servicios", href: "/servicios" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
  { label: "Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
];

const item = "flex min-h-11 items-center";

/**
 * Site footer on the `ink` floor (DESIGN §5.1): contact details, links and
 * social networks (COPY §2, §8). It follows each page's `Closing`, on the
 * same floor. The bottom padding leaves room for the floating WhatsApp button.
 */
export function Footer() {
  return (
    <footer className="on-ink">
      <div className="mx-auto max-w-[1200px] px-5 pt-4 pb-28 lg:px-12">
        <div className="grid gap-8 md:grid-cols-3">
          <address className="flex flex-col not-italic">
            <a href="tel:+593961128233" className={item}>
              0961128233
            </a>
            <a href="tel:+593999843108" className={item}>
              0999843108
            </a>
            <a href="mailto:hola@siete8.com" className={item}>
              hola@siete8.com
            </a>
            <p className={item}>Quito, Ecuador</p>
          </address>
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={item}>
                  {link.label}
                </Link>
              </li>
            ))}
            {clientEnv.NEXT_PUBLIC_GA_ID && (
              <li>
                <CookieSettingsButton
                  className={`${item} cursor-pointer text-left text-accent underline decoration-1 underline-offset-[3px]`}
                />
              </li>
            )}
          </ul>
          <ul className="flex flex-col">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={item}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
