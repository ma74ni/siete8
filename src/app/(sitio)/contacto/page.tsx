import type { Metadata } from "next";

import { Button } from "@/components/sitio/button";
import { Closing } from "@/components/sitio/closing";
import { ContactForm } from "@/components/sitio/contact-form";
import { Floor } from "@/components/sitio/floor";
import { TextLink } from "@/components/sitio/text-link";
import { clientEnv } from "@/env/client";
import { hoursText, toTel } from "@/lib/site-settings";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";
import { pageMetadata } from "@/lib/metadata";
import { getServiceMenu } from "@/server/catalog";
import { submitLead } from "@/server/leads";
import { getSiteSettings } from "@/server/site-settings";

// Texts from docs/COPY.md §10 and §8.

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return pageMetadata({
    title: "Contacto | Siete8",
    description: `Escríbenos por WhatsApp al ${settings.whatsapp.number}, ${hoursText(settings).toLowerCase()}. También por teléfono o a ${settings.email}.`,
    path: "/contacto",
  });
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsapp = whatsappUrl(generalMessage(), settings.whatsapp.waMe);
  const details = [
    { label: "WhatsApp", value: settings.whatsapp.number, href: whatsapp },
    {
      label: "Teléfono",
      value: settings.phone,
      href: `tel:${toTel(settings.phone)}`,
    },
    {
      label: "Correo",
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
  ];

  const siteKey = clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const services = siteKey
    ? (await getServiceMenu()).flatMap((category) =>
        category.services.map(({ slug, name }) => ({ slug, name })),
      )
    : [];

  return (
    <>
      <Floor>
        <div className="flex flex-col items-start gap-6">
          <h1>Contacto</h1>
          <p>
            Escríbenos por WhatsApp y te respondemos{" "}
            {hoursText(settings).toLowerCase()}.
          </p>
          <Button href={whatsapp}>Escríbenos por WhatsApp</Button>
        </div>
      </Floor>
      {/* Without Turnstile keys the form is not shown: WhatsApp still works. */}
      {siteKey && (
        <Floor alt>
          <section aria-labelledby="formulario" className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 id="formulario">¿Prefieres que te escribamos?</h2>
              <p>
                Déjanos tus datos y te respondemos en el horario de atención.
              </p>
            </div>
            <ContactForm
              action={submitLead}
              siteKey={siteKey}
              services={services}
            />
          </section>
        </Floor>
      )}
      <Floor alt={!siteKey}>
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
              {settings.social.map((link) => (
                <li key={link.url}>
                  <TextLink href={link.url}>{link.label}</TextLink>
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
