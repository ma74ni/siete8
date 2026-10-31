import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { CheckboxField } from "@/components/form/checkbox-field";
import { DataTable } from "@/components/admin/data-table";
import { Section } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { FormField } from "@/components/form/form-field";
import { formatDateTime } from "@/lib/blog";
import { getAssistantForAdmin } from "@/server/admin-assistant";
import { saveAssistant } from "@/server/admin-assistant-actions";

// Texts from docs/COPY.md §13.

const usd = (value: number) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

/**
 * The assistant on the site (E10): on or off, the business instructions,
 * the monthly cap with this month's spend, and the latest conversations.
 */
export default async function AssistantPage() {
  const assistant = await getAssistantForAdmin();
  const { settings } = assistant;

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title="Asistente"
        intro={
          <>
            El chat del sitio responde con los servicios, planes, precios y
            preguntas publicados, y pasa a WhatsApp a quien quiere contratar.
            Cuando está activado, reemplaza al botón flotante de WhatsApp.
            <span className="mt-2 block font-medium">
              Este mes: {assistant.conversationsThisMonth}{" "}
              {assistant.conversationsThisMonth === 1
                ? "conversación"
                : "conversaciones"}
              , {usd(assistant.spentThisMonth)} de{" "}
              {usd(settings.monthlyBudgetUsd)}.
            </span>
          </>
        }
      />
      <ActionForm
        action={saveAssistant}
        submitLabel="Guardar asistente"
        resetKey={JSON.stringify(assistant.settings) + assistant.enabled}
      >
        <CheckboxField
          id="field-enabled"
          name="enabled"
          label="Activado en el sitio"
          defaultChecked={assistant.enabled}
        />
        <FormField
          label="Instrucciones del negocio"
          name="prompt"
          multiline
          rows={6}
          maxLength={4000}
          defaultValue={settings.prompt}
          hint="Tono, servicios que quieres destacar, qué preguntar. Las reglas de no inventar precios ni pedir documentos ya vienen incluidas."
        />
        <FormField
          label="Tope mensual (USD)"
          name="budget"
          type="number"
          min={0}
          max={500}
          step="0.01"
          required
          defaultValue={settings.monthlyBudgetUsd}
          hint="Al llegar a este gasto, el chat se apaga hasta el mes siguiente y muestra WhatsApp. Pon también un límite en la consola de Anthropic."
        />
      </ActionForm>

      <Section title="Últimas conversaciones">
        <DataTable
          rows={assistant.recent}
          rowKey={(session) => session.id}
          label="Últimas conversaciones"
          empty="Aún no hay conversaciones."
          minWidth="32rem"
          columns={[
            {
              header: "Fecha",
              rowHeader: true,
              cell: (session) => (
                <Link href={`/admin/asistente/${session.id}`}>
                  {formatDateTime(session.created_at)}
                </Link>
              ),
            },
            {
              header: "Mensajes",
              numeric: true,
              cell: (session) => session.message_count,
            },
            {
              header: "Costo",
              numeric: true,
              cell: (session) => usd(Number(session.cost_usd)),
            },
            { header: "Lead", cell: (session) => session.lead?.name ?? "—" },
          ]}
        />
      </Section>
    </div>
  );
}
