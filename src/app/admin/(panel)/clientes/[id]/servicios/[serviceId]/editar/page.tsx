import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { RenewalInputs } from "@/components/admin/client-service-fields";
import { FormPage } from "@/components/admin/form-page";
import { FormField } from "@/components/form/form-field";
import { SelectField } from "@/components/form/select-field";
import { isUuid } from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import { serviceTitle } from "@/lib/client-record";
import {
  getClientCatalog,
  getClientServiceForAdmin,
} from "@/server/admin-clients";
import { updateClientService } from "@/server/admin-client-services-actions";

// Texts from docs/COPY.md §13 (Clientes, Servicio del cliente).

/** "Editar servicio": its plan, detail, renewal and notes (E14-04). */
export default async function EditClientServicePage({
  params,
}: PageProps<"/admin/clientes/[id]/servicios/[serviceId]/editar">) {
  const { id, serviceId } = await params;
  if (!isUuid(id) || !isUuid(serviceId)) notFound();
  const [found, catalog] = await Promise.all([
    getClientServiceForAdmin(id, serviceId),
    getClientCatalog(),
  ]);
  if (!found) notFound();
  const { client, service } = found;
  const record = adminPaths.clientService(client.id, service.id);
  const plans =
    catalog.find((candidate) => candidate.id === service.service_id)?.plans ??
    [];

  return (
    <FormPage
      title="Editar servicio"
      back={{
        href: record,
        label: `Volver a ${serviceTitle(service)}`,
      }}
    >
      <ActionForm
        action={updateClientService}
        submitLabel="Guardar servicio"
        cancelHref={record}
      >
        <input type="hidden" name="id" value={service.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Plan"
            id="plan"
            name="plan_id"
            defaultValue={service.plan_id ?? ""}
          >
            <option value="">Ninguno</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </SelectField>
          <FormField
            label="Detalle"
            name="detail"
            id="detail"
            maxLength={200}
            defaultValue={service.detail ?? ""}
          />
        </div>
        <RenewalInputs
          idPrefix="renew"
          renewal={{
            value: String(service.renews_every_value ?? ""),
            unit: service.renews_every_unit ?? "",
          }}
        />
        <FormField
          label="Notas"
          name="notes"
          id="notes"
          multiline
          maxLength={4000}
          defaultValue={service.notes ?? ""}
        />
      </ActionForm>
    </FormPage>
  );
}
