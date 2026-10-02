import Link from "next/link";

import { SelectField } from "@/components/admin/fields";
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
      <div className="flex flex-col gap-2">
        <h1 className="text-h2">Leads</h1>
        <p>
          Las personas que te dejaron sus datos, de la más reciente a la más
          antigua.
        </p>
      </div>

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

      {leads.length === 0 ? (
        <p>No hay leads con estos filtros.</p>
      ) : (
        <ul className="flex flex-col border-t border-border">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3"
            >
              <span className="flex flex-col">
                <Link href={`/admin/leads/${lead.id}`}>
                  {lead.name ?? lead.phone ?? lead.email}
                </Link>
                <span className="text-small">
                  {[lead.phone, lead.service?.name].filter(Boolean).join(", ")}
                </span>
              </span>
              <span className="text-small">
                {LEAD_STATUS_LABELS[lead.status]},{" "}
                {LEAD_SOURCE_LABELS[lead.source]},{" "}
                {formatPostDate(lead.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
