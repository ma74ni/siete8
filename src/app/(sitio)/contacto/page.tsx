import type { Metadata } from "next";

import { Button } from "@/components/sitio/button";
import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";
import { TextLink } from "@/components/sitio/text-link";
import { SOCIAL_LINKS } from "@/lib/social";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";
import { pageMetadata } from "@/lib/metadata";

// Texts from docs/COPY.md §10 and §8. The form arrives in E3-08.

const title = "Contacto | Siete8";
const description =
  "Escríbenos por WhatsApp al 0961128233, todos los días de 07:00 a 20:00. También por teléfono o a hola@siete8.com.";

export const metadata: Metadata = pageMetadata({
  title,
  description,
  path: "/contacto",
});

const whatsapp = whatsappUrl(generalMessage());

const details = [
  { label: "WhatsApp", value: "0961128233", href: whatsapp },
  { label: "Teléfono", value: "0999843108", href: "tel:+593999843108" },
  { label: "Correo", value: "hola@siete8.com", href: "mailto:hola@siete8.com" },
];

export default function ContactPage() {
  return (
    <>
      <Floor>
        <div className="flex flex-col items-start gap-6">
          <h1>Contacto</h1>
          <p>
            Escríbenos por WhatsApp y te respondemos todos los días, de 07:00 a
            20:00.
          </p>
          <Button href={whatsapp}>Escríbenos por WhatsApp</Button>
        </div>
      </Floor>
      <Floor alt>
        <div className="grid gap-10 md:grid-cols-2">
          <dl className="flex flex-col gap-4">
            {details.map((detail) => (
              <div key={detail.label} className="flex flex-col">
                <dt className="font-medium">{detail.label}</dt>
                <dd>
                  <TextLink href={detail.href}>{detail.value}</TextLink>
                </dd>
              </div>
            ))}
            <div className="flex flex-col">
              <dt className="font-medium">Dirección</dt>
              <dd>Quito, Ecuador</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-4">
            <h2 className="text-h3">Síguenos</h2>
            <ul className="flex flex-col gap-2">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <TextLink href={link.href}>{link.label}</TextLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Floor>
      <Closing />
    </>
  );
}
