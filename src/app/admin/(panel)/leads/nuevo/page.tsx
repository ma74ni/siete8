import { ActionForm } from "@/components/admin/action-form";
import { CheckboxField } from "@/components/admin/checkbox-field";
import { LeadServiceFields } from "@/components/admin/lead-service-fields";
import { PageHeader } from "@/components/admin/page-header";
import { FormField } from "@/components/sitio/form-field";
import { getClientCatalog } from "@/server/admin-clients";
import { createLead } from "@/server/admin-leads-actions";

// Texts from docs/COPY.md §13 (Leads: Nuevo).

/** A lead entered by hand, for someone who wrote on WhatsApp (E11-07, RF-CRM-23). */
export default async function NewLeadPage() {
  const catalog = await getClientCatalog();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title="Nuevo lead"
        back={{ href: "/admin/leads", label: "Volver a leads" }}
        intro="Para registrar a quien te escribió por WhatsApp. Origen: WhatsApp."
      />
      <ActionForm action={createLead} submitLabel="Crear lead">
        <FormField
          label="Nombre"
          name="name"
          id="lead-name"
          required
          maxLength={120}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Celular"
            name="phone"
            id="lead-phone"
            type="tel"
            inputMode="tel"
            maxLength={30}
          />
          <FormField
            label="Correo"
            name="email"
            id="lead-email"
            type="email"
            maxLength={200}
            hint="Al menos el celular o el correo."
          />
        </div>
        <LeadServiceFields catalog={catalog} />
        <FormField
          label="Mensaje"
          name="message"
          id="lead-message"
          multiline
          maxLength={2000}
          hint="Lo que te preguntó o pidió."
        />
        <FormField
          label="Notas"
          name="notes"
          id="lead-notes"
          multiline
          maxLength={4000}
          hint="Solo las ves tú, en el panel."
        />
        <CheckboxField
          label="La persona aceptó que la contactemos."
          name="consent"
          id="lead-consent"
          required
        />
      </ActionForm>
    </div>
  );
}
