import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { ClientServiceFields } from "@/components/admin/client-service-fields";
import { FormPage } from "@/components/admin/form-page";
import { isUuid } from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import { todayInQuito } from "@/lib/days";
import { getClientCatalog, getClientForAdmin } from "@/server/admin-clients";
import { addClientService } from "@/server/admin-client-services-actions";

// Texts from docs/COPY.md §13 (Clientes, Agregar servicio).

/** "Agregar servicio" on its own page (E14-04); saving goes back to the record. */
export default async function NewClientServicePage({
  params,
}: PageProps<"/admin/clientes/[id]/servicios/nuevo">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [client, catalog] = await Promise.all([
    getClientForAdmin(id),
    getClientCatalog(),
  ]);
  if (!client) notFound();
  const record = adminPaths.client(client.id);

  return (
    <FormPage
      title="Agregar servicio"
      back={{ href: record, label: `Volver a ${client.name}` }}
      intro="Elige el servicio y el plan: el precio, el costo y la renovación se llenan solos y puedes cambiarlos."
    >
      <ActionForm
        action={addClientService}
        submitLabel="Agregar servicio"
        cancelHref={record}
      >
        <input type="hidden" name="client_id" value={client.id} />
        <ClientServiceFields catalog={catalog} today={todayInQuito()} />
      </ActionForm>
    </FormPage>
  );
}
