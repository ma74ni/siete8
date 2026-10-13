import Link from "next/link";

import { SelectField } from "@/components/admin/fields";
import { Button } from "@/components/sitio/button";
import { FormField } from "@/components/sitio/form-field";
import { clientFilters } from "@/lib/admin-forms";
import { expiry, todayInQuito } from "@/lib/clients";
import { cx } from "@/lib/cx";
import { listClientsForAdmin } from "@/server/admin-clients";

// Texts from docs/COPY.md §13.

/** Clients with search and filter by service (E11-01, RF-CRM-01). */
export default async function ClientsPage({
  searchParams,
}: PageProps<"/admin/clientes">) {
  const filters = clientFilters.parse(await searchParams);
  const { clients, services, total } = await listClientsForAdmin(filters);
  const today = todayInQuito();

  return (
    <div className="flex max-w-[72rem] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2">Clientes</h1>
        <p>Lo que tiene contratado cada cliente y cuándo vence.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button href="/admin/clientes/nuevo">Nuevo cliente</Button>
        <Button href="/admin/clientes/importar" variant="secondary">
          Importar desde CSV
        </Button>
        {/* A file download, not a page: a plain link. */}
        <a
          href="/admin/clientes/exportar"
          download
          className="inline-flex min-h-12 items-center"
        >
          Exportar a CSV
        </a>
      </div>

      {/* A plain GET form: the search lives in the address. */}
      <form className="grid items-end gap-4 md:grid-cols-[1fr_16rem_auto]">
        <FormField
          label="Buscar"
          name="q"
          id="filtro-q"
          type="search"
          defaultValue={filters.q ?? ""}
          hint="Nombre, RUC, cédula o correo."
        />
        <SelectField
          label="Servicio"
          id="filtro-servicio"
          name="servicio"
          defaultValue={filters.servicio ?? ""}
        >
          <option value="">Todos</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="secondary" className="md:mb-7">
          Buscar
        </Button>
      </form>

      {total === 0 ? (
        <p>Todavía no hay clientes.</p>
      ) : clients.length === 0 ? (
        <p>No hay clientes con esta búsqueda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Cliente
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  RUC o cédula
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Servicios
                </th>
                <th scope="col" className="py-3 font-medium">
                  Próximo vencimiento
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const next = expiry(client.nextExpiry, today);
                return (
                  <tr
                    key={client.id}
                    className="border-b border-border align-top"
                  >
                    <td className="py-3 pr-4">
                      <Link href={`/admin/clientes/${client.id}`}>
                        {client.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {client.tax_id ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {client.services.length > 0
                        ? client.services.join("; ")
                        : "—"}
                    </td>
                    <td
                      className={cx(
                        "py-3",
                        next.state === "expired" && "font-medium text-accent",
                      )}
                    >
                      {client.hasActive ? next.label : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
