import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { ClientFields } from "@/components/admin/client-fields";
import { ClientServiceFields } from "@/components/admin/client-service-fields";
import { PageHeader } from "@/components/admin/page-header";
import { isUuid } from "@/lib/admin-forms";
import { todayInQuito } from "@/lib/clients";
import { PROFORMA_STATUS_LABELS } from "@/lib/lead-status";
import { formatPriceWithVat } from "@/lib/price";
import { getClientCatalog } from "@/server/admin-clients";
import { acceptProforma } from "@/server/admin-clients-actions";
import { getLeadForAdmin } from "@/server/admin-leads";

// Texts from docs/COPY.md §13 (Leads: Aceptar proforma).

/**
 * "Aceptar proforma" (RF-CRM-19): the client from the lead and its service
 * with the offered price, prefilled and editable. A lead that already has a
 * client gets the service added to it. On its own page, like "Nuevo cliente".
 */
export default async function AcceptProformaPage({
  params,
}: PageProps<"/admin/leads/[id]/aceptar/[proformaId]">) {
  const { id, proformaId } = await params;
  if (!isUuid(id) || !isUuid(proformaId)) notFound();
  const [lead, catalog] = await Promise.all([
    getLeadForAdmin(id),
    getClientCatalog(),
  ]);
  const proforma = lead?.proforma.find(
    (candidate) => candidate.id === proformaId,
  );
  if (!lead || !proforma) notFound();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title="Aceptar proforma"
        back={{ href: `/admin/leads/${lead.id}`, label: "Volver al lead" }}
        intro={[
          proforma.service?.name,
          proforma.plan?.name,
          formatPriceWithVat(proforma.price_without_vat, proforma.vat_rate),
        ]
          .filter(Boolean)
          .join(", ")}
      />

      {proforma.status !== "sent" ? (
        <p>
          Esta proforma ya fue aceptada o rechazada (
          {PROFORMA_STATUS_LABELS[proforma.status]}).
        </p>
      ) : (
        <ActionForm
          action={acceptProforma}
          submitLabel={
            lead.client
              ? "Aceptar y agregar servicio"
              : "Aceptar y crear cliente"
          }
        >
          <input type="hidden" name="proforma_id" value={proforma.id} />
          {lead.client ? (
            <>
              <p>El servicio se agrega a {lead.client.name}.</p>
              {/* The client exists: its data is kept as it is. */}
              <input type="hidden" name="kind" value="person" />
              <input type="hidden" name="name" value={lead.client.name} />
            </>
          ) : (
            <>
              <p>
                Se crea el cliente con este servicio y su primer período, y el
                lead queda como Ganado.
              </p>
              <ClientFields
                client={{
                  kind: "person",
                  name: lead.name ?? "",
                  tax_id: null,
                  phone: lead.phone,
                  email: lead.email,
                  notes: null,
                }}
              />
            </>
          )}
          <fieldset className="flex flex-col gap-4 border-t border-border pt-6">
            <legend className="sr-only">Servicio del cliente</legend>
            <h2 className="text-h3">Servicio del cliente</h2>
            <ClientServiceFields
              catalog={catalog}
              today={todayInQuito()}
              preset={proforma}
            />
          </fieldset>
        </ActionForm>
      )}
    </div>
  );
}
