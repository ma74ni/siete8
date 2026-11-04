import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { FormPage } from "@/components/admin/form-page";
import { RenewFields } from "@/components/admin/renew-form";
import { isUuid } from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import { serviceTitle } from "@/lib/client-record";
import { todayInQuito } from "@/lib/days";
import { renewalOf } from "@/lib/renewals";
import { getClientServiceForAdmin } from "@/server/admin-clients";
import { renewClientServiceFromPage } from "@/server/admin-client-services-actions";

// Texts from docs/COPY.md §13 (Clientes, Renovar).

/**
 * "Renovar" on its own page (E14-04): the next period, prefilled and
 * editable. A one-off or cancelled service has nothing to renew: 404.
 */
export default async function RenewClientServicePage({
  params,
}: PageProps<"/admin/clientes/[id]/servicios/[serviceId]/renovar">) {
  const { id, serviceId } = await params;
  if (!isUuid(id) || !isUuid(serviceId)) notFound();
  const found = await getClientServiceForAdmin(id, serviceId);
  if (!found) notFound();
  const { client, service } = found;
  const next = renewalOf(service, todayInQuito());
  if (!next) notFound();
  const record = adminPaths.clientService(client.id, service.id);
  const title = serviceTitle(service);

  return (
    <FormPage
      title={`Renovar ${title}`}
      back={{ href: record, label: `Volver a ${title}` }}
    >
      <ActionForm
        action={renewClientServiceFromPage}
        submitLabel="Renovar servicio"
        cancelHref={record}
      >
        <RenewFields serviceId={service.id} next={next} />
      </ActionForm>
    </FormPage>
  );
}
