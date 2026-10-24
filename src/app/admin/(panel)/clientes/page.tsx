import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { SelectField } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { StatusText } from "@/components/admin/status-text";
import { Button } from "@/components/sitio/button";
import { FormField } from "@/components/sitio/form-field";
import { clientFilters } from "@/lib/admin-forms";
import { expiry, todayInQuito } from "@/lib/clients";
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
      <PageHeader
        title="Clientes"
        intro="Lo que tiene contratado cada cliente y cuándo vence."
        actions={
          <>
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
          </>
        }
      />

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
        {/* Lined up with the search box, which has a hint below. */}
        <div className="md:mb-7">
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
        </div>
        <Button type="submit" variant="secondary" className="md:mb-7">
          Buscar
        </Button>
      </form>

      <DataTable
        rows={clients}
        rowKey={(client) => client.id}
        label="Clientes"
        empty={
          total === 0
            ? "Todavía no hay clientes."
            : "No hay clientes con esta búsqueda."
        }
        minWidth="40rem"
        columns={[
          {
            header: "Cliente",
            rowHeader: true,
            cell: (client) => (
              <Link href={`/admin/clientes/${client.id}`}>{client.name}</Link>
            ),
          },
          {
            header: "RUC o cédula",
            cell: (client) => client.tax_id ?? "—",
            numeric: true,
          },
          {
            header: "Servicios",
            cell: (client) =>
              client.services.length > 0 ? client.services.join("; ") : "—",
          },
          {
            header: "Próximo vencimiento",
            cell: (client) => {
              if (!client.hasActive) return "—";
              const next = expiry(client.nextExpiry, today);
              return (
                <StatusText
                  tone={next.state === "expired" ? "alert" : "default"}
                >
                  {next.label}
                </StatusText>
              );
            },
          },
        ]}
      />
    </div>
  );
}
