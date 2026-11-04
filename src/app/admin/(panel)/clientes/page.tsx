import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { SelectField } from "@/components/form/select-field";
import { PageHeader } from "@/components/admin/page-header";
import { StatusText } from "@/components/admin/status-text";
import { Button } from "@/components/sitio/button";
import { FormField } from "@/components/form/form-field";
import { clientFilters } from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import { expiry } from "@/lib/clients";
import { todayInQuito } from "@/lib/days";
import {
  clampPage,
  pageCount,
  pageHref,
  pageNumber,
  pageRange,
} from "@/lib/pagination";
import { listClientsForAdmin } from "@/server/admin-clients";

// Texts from docs/COPY.md §13.

/** Clients with search, filter by service and pages of 25 (E11-01, E14-04, RF-CRM-01). */
export default async function ClientsPage({
  searchParams,
}: PageProps<"/admin/clientes">) {
  const params = await searchParams;
  const filters = clientFilters.parse(params);
  const { clients, services, total } = await listClientsForAdmin(filters);
  const today = todayInQuito();
  // The search matches names without accents and the service filter, both in
  // memory over every client (listClientsForAdmin), so the page is cut here
  // instead of with a query `range`.
  const pages = pageCount(clients.length);
  const page = clampPage(pageNumber(params.pagina), pages);
  const { from, to } = pageRange(page);

  return (
    <div className="flex max-w-[72rem] flex-col gap-8">
      <PageHeader
        title="Clientes"
        intro="Lo que tiene contratado cada cliente y cuándo vence."
        actions={
          <>
            <Button href={adminPaths.newClient}>Nuevo cliente</Button>
            <Button href={adminPaths.importClients} variant="secondary">
              Importar desde CSV
            </Button>
            {/* A file download, not a page: a plain link. */}
            <a
              href={adminPaths.exportClients}
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
        rows={clients.slice(from, to + 1)}
        rowKey={(client) => client.id}
        label="Clientes"
        pagination={{
          page,
          pageCount: pages,
          href: (target) => pageHref(adminPaths.clients, filters, target),
        }}
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
              <Link href={adminPaths.client(client.id)}>{client.name}</Link>
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
