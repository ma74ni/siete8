import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { Conversation } from "@/components/admin/conversation";
import { DeleteButton } from "@/components/admin/delete-button";
import { SelectField } from "@/components/admin/fields";
import { ProformaFields } from "@/components/admin/proforma-fields";
import { Button } from "@/components/sitio/button";
import { FormField } from "@/components/sitio/form-field";
import { isUuid } from "@/lib/admin-forms";
import { formatDateTime as dateTime } from "@/lib/blog";
import {
  type CatalogService,
  formatDayShort,
  todayInQuito,
} from "@/lib/clients";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  type LeadStatus,
  PROFORMA_STATUS_LABELS,
} from "@/lib/lead-status";
import { formatPriceWithVat } from "@/lib/price";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { getLeadConversations } from "@/server/admin-assistant";
import { getClientCatalog } from "@/server/admin-clients";
import { getLeadForAdmin, type LeadForAdmin } from "@/server/admin-leads";
import {
  createProforma,
  rejectProforma,
  saveLead,
} from "@/server/admin-leads-actions";

// Texts from docs/COPY.md §13.

/** One lead: contact, message, origin, status with its history, notes (E4-07). */
export default async function LeadPage({
  params,
}: PageProps<"/admin/leads/[id]">) {
  const { id } = await params;
  // A malformed id is just a missing lead; any other error is shown as such.
  if (!isUuid(id)) notFound();
  const [lead, catalog] = await Promise.all([
    getLeadForAdmin(id),
    getClientCatalog(),
  ]);
  if (!lead) notFound();
  const conversations =
    lead.source === "assistant" ? await getLeadConversations(id) : [];

  const utm = Object.entries(lead.utm as Record<string, string>)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link href="/admin/leads" className="text-small">
          Volver a leads
        </Link>
        <h1 className="text-h2">{lead.name ?? lead.phone ?? lead.email}</h1>
      </div>

      <dl className="grid gap-x-10 gap-y-4 md:grid-cols-2">
        {lead.phone && (
          <div className="flex flex-col">
            <dt className="text-small">Celular</dt>
            <dd className="font-medium">
              <a href={whatsappChatUrl(lead.phone)}>{lead.phone}</a> (abre
              WhatsApp)
            </dd>
          </div>
        )}
        {lead.email && (
          <div className="flex flex-col">
            <dt className="text-small">Correo</dt>
            <dd className="font-medium">
              <a href={`mailto:${lead.email}`}>{lead.email}</a>
            </dd>
          </div>
        )}
        {[
          { label: "Servicio", value: lead.service?.name },
          { label: "Plan", value: lead.plan?.name },
          { label: "Origen", value: LEAD_SOURCE_LABELS[lead.source] },
          { label: "Campaña", value: utm },
          { label: "Recibido", value: dateTime(lead.created_at) },
          { label: "Consentimiento", value: dateTime(lead.consent_at) },
        ]
          .filter((fact) => fact.value)
          .map((fact) => (
            <div key={fact.label} className="flex flex-col">
              <dt className="text-small">{fact.label}</dt>
              <dd className="font-medium">{fact.value}</dd>
            </div>
          ))}
      </dl>

      <section className="flex flex-col gap-3 border-t border-border pt-8">
        <h2 className="text-h3">Mensaje</h2>
        <p className="whitespace-pre-line">{lead.message ?? "Sin mensaje."}</p>
      </section>

      {conversations.map((conversation) => (
        <section
          key={conversation.id}
          className="flex flex-col gap-3 border-t border-border pt-8"
        >
          <h2 className="text-h3">Conversación con el asistente</h2>
          <Conversation messages={conversation.chat_message} />
        </section>
      ))}

      <section className="flex flex-col gap-6 border-t border-border pt-8">
        <h2 className="text-h3">Seguimiento</h2>
        <ActionForm
          action={saveLead}
          submitLabel="Guardar lead"
          resetKey={lead.updated_at}
        >
          <input type="hidden" name="id" value={lead.id} />
          <SelectField
            label="Estado"
            id="field-status"
            name="status"
            defaultValue={lead.status}
          >
            {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </SelectField>
          <FormField
            label="Motivo"
            name="lost_reason"
            id="field-lost-reason"
            maxLength={500}
            defaultValue={lead.lost_reason ?? ""}
            hint="Solo si está perdido. Por ejemplo: eligió otro proveedor, no respondió, le pareció caro."
          />
          <FormField
            label="Notas"
            name="notes"
            multiline
            maxLength={4000}
            defaultValue={lead.notes ?? ""}
            hint="Solo las ves tú, en el panel."
          />
        </ActionForm>
        <div className="flex flex-col gap-2">
          <h3 className="text-h4">Historial de estados</h3>
          <ol className="flex flex-col gap-1">
            {lead.lead_status_event.map((event) => (
              <li key={`${event.status}-${event.created_at}`}>
                {LEAD_STATUS_LABELS[event.status]}: {dateTime(event.created_at)}
              </li>
            ))}
          </ol>
        </div>
        <LeadClient lead={lead} />
      </section>

      <Proformas lead={lead} catalog={catalog} today={todayInQuito()} />
    </div>
  );
}

/** The lead's client, or "Crear cliente" from its data (RF-CRM-20). */
function LeadClient({ lead }: { lead: LeadForAdmin }) {
  return lead.client ? (
    <p>
      Cliente:{" "}
      <Link href={`/admin/clientes/${lead.client.id}`}>{lead.client.name}</Link>
    </p>
  ) : (
    <Button
      href={`/admin/clientes/nuevo?lead=${lead.id}`}
      variant="secondary"
      className="self-start"
    >
      Crear cliente
    </Button>
  );
}

/** What was quoted to the lead, and sending, accepting or rejecting it (RF-CRM-19). */
function Proformas({
  lead,
  catalog,
  today,
}: {
  lead: LeadForAdmin;
  catalog: CatalogService[];
  today: string;
}) {
  return (
    <section className="flex flex-col gap-6 border-t border-border pt-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-h3">Proformas</h2>
        <p>Lo que le cotizaste a este lead.</p>
      </div>
      {lead.proforma.length === 0 ? (
        <p>Todavía no le enviaste proformas.</p>
      ) : (
        <ul className="flex flex-col border-t border-border">
          {lead.proforma.map((proforma) => (
            <li
              key={proforma.id}
              className="flex flex-col gap-3 border-b border-border py-4"
            >
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-5">
                {[
                  { label: "Servicio", value: proforma.service?.name ?? "—" },
                  { label: "Plan", value: proforma.plan?.name ?? "—" },
                  {
                    label: "Precio con IVA",
                    value: formatPriceWithVat(
                      proforma.price_without_vat,
                      proforma.vat_rate,
                    ),
                  },
                  { label: "Enviada", value: formatDayShort(proforma.sent_on) },
                  {
                    label: "Estado",
                    value: PROFORMA_STATUS_LABELS[proforma.status],
                  },
                ].map((fact) => (
                  <div key={fact.label} className="flex flex-col">
                    <dt className="text-small">{fact.label}</dt>
                    <dd className="font-medium tabular-nums">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {proforma.status === "sent" && (
                <div className="flex flex-wrap items-start gap-4">
                  <Button
                    href={`/admin/leads/${lead.id}/aceptar/${proforma.id}`}
                  >
                    Aceptar
                  </Button>
                  <DeleteButton
                    action={rejectProforma}
                    id={proforma.id}
                    label="Rechazar"
                    question={`¿Rechazar la proforma de ${proforma.service?.name ?? ""}? El lead no cambia de estado.`}
                    confirmLabel="Sí, rechazar"
                    cancelLabel="No"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-control border border-border p-5">
        <summary className="cursor-pointer font-medium">Nueva proforma</summary>
        <ActionForm
          action={createProforma}
          submitLabel="Registrar proforma"
          className="mt-6"
          resetKey={String(lead.proforma.length)}
        >
          <input type="hidden" name="lead_id" value={lead.id} />
          <ProformaFields catalog={catalog} />
          <FormField
            label="Fecha de envío"
            name="sent_on"
            id="proforma-sent-on"
            type="date"
            required
            className="max-w-[16rem]"
            defaultValue={today}
          />
          <p className="text-small">
            Si el lead está en Nuevo o Contactado, pasa a Proforma enviada.
          </p>
        </ActionForm>
      </details>
    </section>
  );
}
