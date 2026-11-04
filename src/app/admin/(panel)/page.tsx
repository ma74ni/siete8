import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { Section } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { StatusText } from "@/components/admin/status-text";
import { adminPaths } from "@/lib/admin-paths";
import { formatPostDate } from "@/lib/blog";
import { formatDay, todayInQuito } from "@/lib/days";
import { LEAD_SOURCE_LABELS } from "@/lib/lead-status";
import { formatCents, priceWithVatCents } from "@/lib/price";
import { getTodayReport } from "@/server/admin-today";

// Texts from docs/COPY.md §13.

/** A client's name linked to their page; "—" for a row without client. */
function ClientLink({
  clientId,
  name,
}: {
  clientId: string | null;
  name: string;
}) {
  return clientId ? (
    <Link href={adminPaths.client(clientId)}>{name}</Link>
  ) : (
    "—"
  );
}

/** Panel home: what needs attention today (E14-03, DESIGN §12.2 rule 7). */
export default async function TodayPage() {
  const today = await getTodayReport(todayInQuito());

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <PageHeader
        title="Hoy"
        intro="Lo que necesita tu atención: lo que vence esta semana, lo que te deben y quién espera respuesta."
      />

      <Section title="Vence en 7 días">
        <DataTable
          rows={today.due}
          rowKey={(row) => row.id}
          label="Vence en 7 días"
          empty="Nada vence esta semana."
          minWidth="20rem"
          columns={[
            {
              header: "Cliente",
              rowHeader: true,
              cell: (row) => (
                <ClientLink clientId={row.clientId} name={row.client} />
              ),
            },
            { header: "Servicio", cell: (row) => row.service },
            {
              header: "Vence",
              cell: (row) =>
                row.expired ? (
                  <StatusText tone="alert">{row.expiry}</StatusText>
                ) : (
                  row.expiry
                ),
            },
          ]}
        />
        <Link href={adminPaths.due} className="self-start">
          Ver todo lo que vence
        </Link>
      </Section>

      <Section title="Te deben">
        {today.owedCents > 0 && (
          <p>
            Total por cobrar:{" "}
            <span className="text-h3">
              <StatusText tone="alert">
                {formatCents(today.owedCents)}
              </StatusText>
            </span>
          </p>
        )}
        <DataTable
          rows={today.owed}
          rowKey={(row) => row.clientId ?? "sin-cliente"}
          label="Te deben"
          empty="Nadie te debe nada."
          minWidth="20rem"
          columns={[
            {
              header: "Cliente",
              rowHeader: true,
              cell: (row) => (
                <ClientLink clientId={row.clientId} name={row.client} />
              ),
            },
            { header: "Servicios", cell: (row) => row.services.join(", ") },
            {
              header: "Debe",
              numeric: true,
              emphasis: true,
              cell: (row) => formatCents(row.owedCents),
            },
          ]}
        />
        <Link href={adminPaths.owed} className="self-start">
          Ver todo lo que te deben
        </Link>
      </Section>

      <Section title="Leads sin contactar">
        <DataTable
          rows={today.leads}
          rowKey={(lead) => lead.id}
          label="Leads sin contactar"
          empty="No hay leads nuevos."
          minWidth="28rem"
          columns={[
            {
              header: "Nombre",
              rowHeader: true,
              cell: (lead) => (
                <Link href={adminPaths.lead(lead.id)}>{lead.name}</Link>
              ),
            },
            { header: "Servicio", cell: (lead) => lead.service?.name ?? "—" },
            {
              header: "Origen",
              cell: (lead) => LEAD_SOURCE_LABELS[lead.source],
            },
            {
              header: "Recibido",
              cell: (lead) => formatPostDate(lead.created_at),
            },
          ]}
        />
        <Link href={adminPaths.leads} className="self-start">
          Ver todos los leads
        </Link>
      </Section>

      <Section title="Proformas sin respuesta">
        <DataTable
          rows={today.proformas}
          rowKey={(proforma) => proforma.id}
          label="Proformas sin respuesta"
          empty="No hay proformas esperando respuesta."
          minWidth="28rem"
          columns={[
            {
              header: "Lead",
              rowHeader: true,
              cell: (proforma) =>
                proforma.lead ? (
                  <Link href={adminPaths.lead(proforma.lead.id)}>
                    {proforma.lead.name}
                  </Link>
                ) : (
                  "—"
                ),
            },
            {
              header: "Servicio",
              cell: (proforma) => proforma.service?.name ?? "—",
            },
            {
              header: "Precio con IVA",
              numeric: true,
              cell: (proforma) =>
                formatCents(
                  priceWithVatCents(
                    proforma.price_without_vat,
                    proforma.vat_rate,
                  ),
                ),
            },
            {
              header: "Enviada",
              cell: (proforma) => formatDay(proforma.sent_on),
            },
          ]}
        />
      </Section>
    </div>
  );
}
