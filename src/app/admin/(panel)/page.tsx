import Link from "next/link";

import { listServicesForAdmin } from "@/server/admin-catalog";

// Texts from docs/COPY.md §13.

/** Panel home: every service by category, hidden ones included (E4-02). */
export default async function PanelHome() {
  const categories = await listServicesForAdmin();

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2">Servicios</h1>
        <p>
          Elige un servicio para cambiar sus planes, precios y textos. Lo que
          guardes se ve en el sitio en menos de un minuto.
        </p>
      </div>
      {categories.map((category) => (
        <section key={category.id} className="flex flex-col gap-3">
          <h2 className="text-h4">
            {category.name}
            {!category.visible && (
              <span className="font-normal"> (categoría oculta)</span>
            )}
          </h2>
          <ul className="flex flex-col border-t border-border">
            {category.service.map((service) => (
              <li
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3"
              >
                <Link href={`/admin/servicios/${service.id}`}>
                  {service.name}
                </Link>
                <span className="text-small">
                  {service.visible ? "Visible" : "Oculto"}
                  {", "}
                  {service.plan.length === 1
                    ? "1 plan"
                    : `${service.plan.length} planes`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
