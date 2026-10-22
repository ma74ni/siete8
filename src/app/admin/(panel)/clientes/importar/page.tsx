import Link from "next/link";

import { ClientImportForm } from "@/components/admin/client-import-form";
import { getClientCatalog } from "@/server/admin-clients";
import { importClientsCsv } from "@/server/admin-clients-actions";

// Texts from docs/COPY.md §13.

/** Load the current clients from a spreadsheet (RF-CRM-07). */
export default async function ImportClientsPage() {
  const catalog = await getClientCatalog();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/clientes" className="text-small">
          Volver a clientes
        </Link>
        <h1 className="text-h2">Importar clientes</h1>
      </div>
      <ol className="flex max-w-[68ch] list-decimal flex-col gap-2 pl-5">
        <li>
          <a href="/admin/clientes/plantilla" download>
            Descarga la plantilla
          </a>
          .
        </li>
        <li>
          Llénala en Excel: una fila por servicio; si un cliente tiene varios
          servicios, repite sus datos en cada fila. Las fechas van como
          dd/mm/aaaa. Si dejas vacíos el precio, el costo o renueva_cada, se
          toman del plan; si dejas vacío hasta, se calcula con renueva_cada.
        </li>
        <li>
          La columna pagado es opcional: escribe sí si ya te pagaron ese período
          y se registra el total en la fecha de venta.
        </li>
        <li>Guárdala como CSV y súbela.</li>
      </ol>
      <p className="max-w-[68ch]">
        Si un RUC o cédula ya existe, sus servicios se agregan a ese cliente.
      </p>
      <details>
        <summary className="cursor-pointer font-medium">
          Servicios que puedes escribir en la columna servicio
        </summary>
        <ul className="mt-3 flex list-disc flex-col gap-1 pl-5">
          {catalog.map((service) => (
            <li key={service.id}>
              {service.name}
              {service.plans.length > 0 &&
                `: ${service.plans.map((plan) => plan.name).join(", ")}`}
            </li>
          ))}
        </ul>
      </details>
      <ClientImportForm action={importClientsCsv} />
    </div>
  );
}
