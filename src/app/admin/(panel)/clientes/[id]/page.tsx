import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { ClientFields } from "@/components/admin/client-fields";
import {
  ClientServiceFields,
  RenewalInputs,
} from "@/components/admin/client-service-fields";
import { DeleteButton } from "@/components/admin/delete-button";
import { Section, SelectField } from "@/components/admin/fields";
import { PriceField } from "@/components/admin/price-field";
import { FormField } from "@/components/sitio/form-field";
import { isUuid } from "@/lib/admin-forms";
import { formatPostDate } from "@/lib/blog";
import {
  type CatalogService,
  CLIENT_KIND_LABELS,
  expiry,
  formatDecimal,
  formatSignedCents,
  profitCents,
  todayInQuito,
} from "@/lib/clients";
import { cx } from "@/lib/cx";
import { formatPriceWithVat } from "@/lib/price";
import {
  type ClientForAdmin,
  getClientCatalog,
  getClientForAdmin,
} from "@/server/admin-clients";
import {
  addClientService,
  cancelClientService,
  deleteClient,
  reactivateClientService,
  savePeriod,
  updateClient,
  updateClientService,
} from "@/server/admin-clients-actions";

// Texts from docs/COPY.md §13.

type ClientService = ClientForAdmin["client_service"][number];

/** One page per client: data and services (E11-01, RF-CRM-02). */
export default async function ClientPage({
  params,
}: PageProps<"/admin/clientes/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [client, catalog] = await Promise.all([
    getClientForAdmin(id),
    getClientCatalog(),
  ]);
  if (!client) notFound();
  const today = todayInQuito();

  return (
    <div className="flex max-w-[72rem] flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link href="/admin/clientes" className="text-small">
          Volver a clientes
        </Link>
        <h1 className="text-h2">{client.name}</h1>
        <p>
          {[CLIENT_KIND_LABELS[client.kind], client.tax_id]
            .filter(Boolean)
            .join(", ")}
          {client.lead && (
            <>
              {". "}
              <Link href={`/admin/leads/${client.lead.id}`}>
                Lead de origen
              </Link>
            </>
          )}
        </p>
      </div>

      <Section title="Servicios">
        {client.client_service.length === 0 ? (
          <p>Este cliente todavía no tiene servicios.</p>
        ) : (
          <ServicesTable services={client.client_service} today={today} />
        )}
        {client.client_service.map((service) => (
          <ServiceEditor
            key={service.id}
            service={service}
            clientName={client.name}
            catalog={catalog}
          />
        ))}
        <details className="rounded-control border border-border p-5">
          <summary className="cursor-pointer font-medium">
            Agregar servicio
          </summary>
          <ActionForm
            action={addClientService}
            submitLabel="Agregar servicio"
            className="mt-6"
            resetKey={String(client.client_service.length)}
          >
            <input type="hidden" name="client_id" value={client.id} />
            <ClientServiceFields
              catalog={catalog}
              today={today}
              idPrefix="new-service"
            />
          </ActionForm>
        </details>
      </Section>

      <Section title="Datos del cliente">
        <ActionForm
          action={updateClient}
          submitLabel="Guardar cliente"
          resetKey={client.updated_at}
        >
          <input type="hidden" name="id" value={client.id} />
          <ClientFields client={client} />
        </ActionForm>
      </Section>

      <div className="border-t border-border pt-8">
        <DeleteButton
          action={deleteClient}
          id={client.id}
          label="Borrar cliente"
          question={`¿Borrar a ${client.name}? Se borran también sus servicios y su historial, y no se puede deshacer. Si ya no trabaja contigo, mejor cancela sus servicios.`}
        />
      </div>
    </div>
  );
}

function serviceTitle(service: ClientService) {
  return [service.service?.name, service.detail].filter(Boolean).join(", ");
}

function ServicesTable({
  services,
  today,
}: {
  services: ClientService[];
  today: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            {["Servicio", "Detalle", "Precio con IVA", "Vence", "Estado"].map(
              (column) => (
                <th key={column} scope="col" className="py-3 pr-4 font-medium">
                  {column}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {services.map((service) => {
            const current = service.client_service_period[0];
            const due = expiry(current?.ends_on ?? null, today);
            const cancelled = service.status === "cancelled";
            return (
              <tr key={service.id} className="border-b border-border align-top">
                <td className="py-3 pr-4">
                  <a href={`#servicio-${service.id}`}>
                    {service.service?.name}
                  </a>
                </td>
                <td className="py-3 pr-4">{service.detail ?? "—"}</td>
                <td className="py-3 pr-4 tabular-nums">
                  {current
                    ? formatPriceWithVat(
                        current.price_without_vat,
                        current.vat_rate,
                      )
                    : "—"}
                </td>
                <td
                  className={cx(
                    "py-3 pr-4",
                    !cancelled &&
                      due.state === "expired" &&
                      "font-medium text-accent",
                  )}
                >
                  {due.label}
                </td>
                <td className="py-3">
                  {cancelled && service.cancelled_at
                    ? `Cancelado el ${formatPostDate(service.cancelled_at)}`
                    : "Activo"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ServiceEditor({
  service,
  clientName,
  catalog,
}: {
  service: ClientService;
  clientName: string;
  catalog: CatalogService[];
}) {
  const plans =
    catalog.find((candidate) => candidate.id === service.service_id)?.plans ??
    [];
  const key = service.id;

  return (
    <details
      id={`servicio-${service.id}`}
      className="rounded-control border border-border p-5"
    >
      <summary className="cursor-pointer font-medium">
        {serviceTitle(service)}
        {service.status === "cancelled" && " (cancelado)"}
      </summary>
      <div className="mt-6 flex flex-col gap-8">
        <ActionForm
          action={updateClientService}
          submitLabel="Guardar servicio"
          resetKey={service.updated_at}
        >
          <input type="hidden" name="id" value={service.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Plan"
              id={`plan-${key}`}
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
              id={`detail-${key}`}
              maxLength={200}
              defaultValue={service.detail ?? ""}
            />
          </div>
          <RenewalInputs
            idPrefix={`renew-${key}`}
            renewal={{
              value: String(service.renews_every_value ?? ""),
              unit: service.renews_every_unit ?? "",
            }}
          />
          <FormField
            label="Notas"
            name="notes"
            id={`notes-${key}`}
            multiline
            maxLength={4000}
            defaultValue={service.notes ?? ""}
          />
        </ActionForm>

        <div className="flex flex-col gap-4">
          <h3 className="text-h4">Historial</h3>
          {service.client_service_period.map((period) => (
            <PeriodEditor key={period.id} period={period} />
          ))}
        </div>

        {service.status === "active" ? (
          <DeleteButton
            action={cancelClientService}
            id={service.id}
            label="Cancelar servicio"
            question={`¿Cancelar ${serviceTitle(service)} de ${clientName}? Deja de aparecer en por vencer; su historial se conserva.`}
            confirmLabel="Sí, cancelar"
            cancelLabel="No"
          />
        ) : (
          <ActionForm
            action={reactivateClientService}
            submitLabel="Reactivar servicio"
            variant="secondary"
          >
            <input type="hidden" name="id" value={service.id} />
          </ActionForm>
        )}
      </div>
    </details>
  );
}

function PeriodEditor({
  period,
}: {
  period: ClientService["client_service_period"][number];
}) {
  const key = period.id;
  return (
    <ActionForm
      action={savePeriod}
      submitLabel="Guardar período"
      variant="secondary"
      resetKey={period.updated_at}
      className="border-t border-border pt-4"
    >
      <input type="hidden" name="id" value={period.id} />
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          label="Venta"
          name="sold_on"
          id={`sold-${key}`}
          type="date"
          required
          defaultValue={period.sold_on}
        />
        <FormField
          label="Desde"
          name="starts_on"
          id={`starts-${key}`}
          type="date"
          required
          defaultValue={period.starts_on}
        />
        <FormField
          label="Hasta"
          name="ends_on"
          id={`ends-${key}`}
          type="date"
          defaultValue={period.ends_on ?? ""}
          hint="Vacío: no vence."
        />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <PriceField
          idPrefix={`period-${key}`}
          price={period.price_without_vat}
          vatRate={period.vat_rate}
          previewLabel="Con IVA"
        />
        <FormField
          label="Costo"
          name="cost_without_vat"
          id={`cost-${key}`}
          inputMode="decimal"
          className="w-32"
          defaultValue={formatDecimal(period.cost_without_vat)}
        />
        <p className="flex min-h-12 flex-col justify-center">
          <span className="text-small">Ganancia</span>
          <span className="font-medium tabular-nums">
            {formatSignedCents(
              profitCents(period.price_without_vat, period.cost_without_vat),
            )}
          </span>
        </p>
      </div>
    </ActionForm>
  );
}
