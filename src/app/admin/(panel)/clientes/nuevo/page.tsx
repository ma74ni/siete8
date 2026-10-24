import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { ClientFields } from "@/components/admin/client-fields";
import { ClientServiceFields } from "@/components/admin/client-service-fields";
import { PageHeader } from "@/components/admin/page-header";
import { isUuid } from "@/lib/admin-forms";
import { todayInQuito } from "@/lib/clients";
import { createClient } from "@/server/admin-clients-actions";
import { getClientCatalog } from "@/server/admin-clients";
import { getLeadContact } from "@/server/admin-leads";

// Texts from docs/COPY.md §13.

/**
 * New client with its first service in one form (RF-CRM-04). From a lead
 * ("Crear cliente", RF-CRM-20) its name, phone and email come prefilled and
 * the client is linked to it.
 */
export default async function NewClientPage({
  searchParams,
}: PageProps<"/admin/clientes/nuevo">) {
  const { lead: leadId } = await searchParams;
  const [catalog, lead] = await Promise.all([
    getClientCatalog(),
    typeof leadId === "string" && isUuid(leadId)
      ? getLeadContact(leadId)
      : null,
  ]);

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title="Nuevo cliente"
        back={{ href: "/admin/clientes", label: "Volver a clientes" }}
        intro={
          lead && !lead.client
            ? `Datos copiados del lead ${lead.name ?? lead.phone ?? lead.email}; el cliente queda enlazado a él.`
            : undefined
        }
      />
      {lead?.client ? (
        <p>
          Este lead ya tiene cliente:{" "}
          <Link href={`/admin/clientes/${lead.client.id}`}>
            {lead.client.name}
          </Link>
        </p>
      ) : (
        <ActionForm action={createClient} submitLabel="Crear cliente">
          {lead && <input type="hidden" name="lead_id" value={lead.id} />}
          <ClientFields
            client={
              lead
                ? {
                    kind: "person",
                    name: lead.name ?? "",
                    tax_id: null,
                    phone: lead.phone,
                    email: lead.email,
                    notes: null,
                  }
                : undefined
            }
          />
          <fieldset className="flex flex-col gap-4 border-t border-border pt-6">
            <legend className="sr-only">Primer servicio</legend>
            <h2 className="text-h3">Primer servicio</h2>
            <p>
              Opcional: puedes agregarlo ahora o después, desde la ficha del
              cliente.
            </p>
            <ClientServiceFields
              catalog={catalog}
              today={todayInQuito()}
              optional
            />
          </fieldset>
        </ActionForm>
      )}
    </div>
  );
}
