import type { Metadata } from "next";
import Link from "next/link";

import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";
import { CategoryDivider } from "@/components/sitio/motif/category-divider";
import { getServiceMenu } from "@/server/catalog";
import { pageMetadata } from "@/lib/metadata";

// Texts from docs/COPY.md §9; categories and services from the catalog.

const title =
  "Servicios: sitios web, hosting, firma electrónica y más | Siete8";
const description =
  "Sitios web, hosting, correo corporativo, dominios, firma electrónica, desarrollo a medida y soporte técnico en Quito. Precios con IVA y atención por WhatsApp.";

export const metadata: Metadata = pageMetadata({
  title,
  description,
  path: "/servicios",
});

/** Service catalog grouped by category, in panel order (RF-PUB-02). */
export default async function ServicesPage() {
  const categories = await getServiceMenu();

  return (
    <>
      <Floor>
        <div className="flex max-w-[68ch] flex-col gap-6">
          <h1>Servicios</h1>
          <p>
            Todo lo que tu negocio necesita para estar en internet, cumplir con
            el SRI y ordenar sus procesos. Elige un servicio para ver planes,
            precios y requisitos.
          </p>
        </div>
      </Floor>
      {categories.map((category, index) => (
        <Floor
          key={category.slug}
          id={category.slug}
          alt={index % 2 === 0}
          aria-labelledby={`categoria-${category.slug}`}
        >
          <div className="flex flex-col gap-10">
            <div className="flex max-w-[68ch] flex-col gap-4">
              <div className="flex items-center gap-3">
                <CategoryDivider />
                <h2 id={`categoria-${category.slug}`}>{category.name}</h2>
              </div>
              {category.description && <p>{category.description}</p>}
            </div>
            <ul className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {category.services.map((service) => (
                <li key={service.slug} className="flex flex-col gap-2">
                  <h3 id={`servicio-${service.slug}`} className="text-h4">
                    {service.name}
                  </h3>
                  {service.summary && <p>{service.summary}</p>}
                  <Link
                    href={`/servicios/${service.slug}`}
                    // Every service repeats the link text; the name tells
                    // them apart.
                    aria-describedby={`servicio-${service.slug}`}
                    className="flex min-h-11 items-center self-start"
                  >
                    Ver planes y requisitos
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Floor>
      ))}
      <Closing />
    </>
  );
}
