import Link from "next/link";

const links = [
  { label: "Servicios", href: "/servicios" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Blog", href: "/blog" },
  { label: "Privacidad", href: "/privacidad" },
];

// COPY §8.
const social = [
  { label: "Facebook", href: "https://www.facebook.com/siete8.ec" },
  { label: "Instagram", href: "https://www.instagram.com/siete8.ec" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/siete8.ec" },
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
          </ul>
          <ul className="flex flex-col">
            {social.map((link) => (
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
