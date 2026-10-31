import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { SelectField } from "@/components/form/select-field";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/sitio/button";
import { leadFilters } from "@/lib/admin-forms";
import { formatPostDate } from "@/lib/blog";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  type LeadSource,
  type LeadStatus,
} from "@/lib/lead-status";
import { listLeadsForAdmin } from "@/server/admin-leads";

// Texts from docs/COPY.md §13.

/** Leads with filters by status, source and service (E4-07, RF-ADM-06). */
export default async function LeadsPage({
  searchParams,
}: PageProps<"/admin/leads">) {
  const filters = leadFilters.parse(await searchParams);
  const { leads, services } = await listLeadsForAdmin(filters);

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title="Leads"
        intro="Las personas que te dejaron sus datos, de la más reciente a la más antigua."
        actions={<Button href="/admin/leads/nuevo">Nuevo lead</Button>}
      />

      {/* A plain GET form: the filters live in the address. */}
      <form className="grid items-end gap-4 md:grid-cols-4">
        <SelectField
          label="Estado"
          id="filtro-estado"
          name="estado"
          defaultValue={filters.estado ?? ""}
        >
          <option value="">Todos</option>
          {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Origen"
          id="filtro-origen"
          name="origen"
          defaultValue={filters.origen ?? ""}
        >
          <option value="">Todos</option>
          {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((source) => (
            <option key={source} value={source}>
              {LEAD_SOURCE_LABELS[source]}
            </option>
          ))}
        </SelectField>
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
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <DataTable
        rows={leads}
        rowKey={(lead) => lead.id}
        label="Leads"
        empty="No hay leads con estos filtros."
        minWidth="52rem"
        columns={[
          {
            header: "Nombre",
            rowHeader: true,
            cell: (lead) => (
              <Link href={`/admin/leads/${lead.id}`}>
                {lead.name ?? lead.phone ?? lead.email}
              </Link>
            ),
          },
          { header: "Celular", cell: (lead) => lead.phone ?? "—" },
          { header: "Servicio", cell: (lead) => lead.service?.name ?? "—" },
          { header: "Estado", cell: (lead) => LEAD_STATUS_LABELS[lead.status] },
          { header: "Origen", cell: (lead) => LEAD_SOURCE_LABELS[lead.source] },
          {
            header: "Recibido",
            cell: (lead) => formatPostDate(lead.created_at),
          },
        ]}
      />
    </div>
  );
}
