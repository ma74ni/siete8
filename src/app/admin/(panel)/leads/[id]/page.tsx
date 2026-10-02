import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { Conversation } from "@/components/admin/conversation";
import { SelectField } from "@/components/admin/fields";
import { FormField } from "@/components/sitio/form-field";
import { isUuid } from "@/lib/admin-forms";
import { formatDateTime as dateTime } from "@/lib/blog";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/lead-status";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { getLeadConversations } from "@/server/admin-assistant";
import { getLeadForAdmin } from "@/server/admin-leads";
import { saveLead } from "@/server/admin-leads-actions";

// Texts from docs/COPY.md §13.

/** One lead: contact, message, origin, status with its history, notes (E4-07). */
export default async function LeadPage({
  params,
}: PageProps<"/admin/leads/[id]">) {
  const { id } = await params;
  // A malformed id is just a missing lead; any other error is shown as such.
  if (!isUuid(id)) notFound();
  const lead = await getLeadForAdmin(id);
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
      </section>
    </div>
  );
}
