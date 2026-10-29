import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { listServicesForAdmin } from "@/server/admin-catalog";

// Texts from docs/COPY.md §13.

/** Panel home: every service by category, hidden ones included (E4-02). */
export default async function PanelHome() {
  const categories = await listServicesForAdmin();

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <PageHeader
        title="Servicios"
        intro="Elige un servicio para cambiar sus planes, precios y textos. Lo que guardes se ve en el sitio en menos de un minuto."
      />
      {categories.map((category) => (
        <section key={category.id} className="flex flex-col gap-3">
          <h2 className="text-h4">
            {category.name}
            {!category.visible && (
              <span className="font-normal"> (categoría oculta)</span>
            )}
          </h2>
          <DataTable
            rows={category.service}
            rowKey={(service) => service.id}
            label={category.name}
            empty="Esta categoría todavía no tiene servicios."
            minWidth="20rem"
            columns={[
              {
                header: "Servicio",
                rowHeader: true,
                cell: (service) => (
                  <Link href={`/admin/servicios/${service.id}`}>
                    {service.name}
                  </Link>
                ),
              },
              {
                header: "Estado",
                cell: (service) => (service.visible ? "Visible" : "Oculto"),
              },
              {
                header: "Planes",
                cell: (service) =>
                  service.plan.length === 1
                    ? "1 plan"
                    : `${service.plan.length} planes`,
              },
            ]}
          />
        </section>
      ))}
    </div>
  );
}
