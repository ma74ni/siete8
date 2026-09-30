import Link from "next/link";

import { Button } from "@/components/sitio/button";
import { MobileMenu } from "@/components/sitio/layout/mobile-menu";
import { ServicesMenu } from "@/components/sitio/layout/services-menu";
import { Logo } from "@/components/sitio/logo";
import { type MenuCategory, type NavLink } from "@/lib/menu";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";

const cta = {
  label: "Escríbenos por WhatsApp",
  href: whatsappUrl(generalMessage()),
};

/** Site header (COPY §2): logo, Servicios menu, main links and WhatsApp. */
export function Header({
  categories,
  links,
}: {
  categories: MenuCategory[];
  links: NavLink[];
}) {
  return (
    <header className="relative border-b border-border bg-bg">
      <div className="mx-auto flex h-[4.5rem] max-w-[1200px] items-center justify-between gap-4 px-5 lg:px-12">
        <Link href="/" className="flex min-h-11 items-center text-fg">
          <Logo className="h-10 w-auto" />
        </Link>
        <nav className="hidden items-center lg:flex">
          <ServicesMenu categories={categories} />
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center px-3 font-medium text-fg no-underline hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Button href={cta.href}>{cta.label}</Button>
        </div>
        <div className="lg:hidden">
          <MobileMenu categories={categories} links={links} cta={cta} />
        </div>
      </div>
    </header>
  );
}
