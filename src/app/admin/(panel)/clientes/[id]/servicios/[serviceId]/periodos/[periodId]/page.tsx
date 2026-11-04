import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { Disclosure } from "@/components/admin/disclosure";
import { EmptyState } from "@/components/admin/empty-state";
import { Section } from "@/components/admin/fields";
import { FormPage } from "@/components/admin/form-page";
import { Notice } from "@/components/admin/notice";
import { PriceField } from "@/components/admin/price-field";
import { FormField } from "@/components/form/form-field";
import { isUuid } from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import { periodName, serviceTitle } from "@/lib/client-record";
import { formatDecimal, formatSignedCents, profitCents } from "@/lib/clients";
import { formatDay } from "@/lib/days";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments";
import { formatCents, toCents } from "@/lib/price";
import { serviceLicensesCostCents } from "@/lib/purchases";
import {
  type ClientServiceForAdmin,
  getClientServiceForAdmin,
} from "@/server/admin-clients";
import {
  clearWriteOff,
  deletePayment,
  writeOffPeriod,
} from "@/server/admin-client-payments-actions";
import { savePeriod } from "@/server/admin-client-services-actions";
import { getPurchasesForClientServices } from "@/server/admin-purchases";

// Texts from docs/COPY.md §13 (Clientes, Ficha, Pagos y No pagará).

type Period = ClientServiceForAdmin["client_service_period"][number];

/**
 * One period of a service's history on its own page (E14-04): its dates,
 * price and cost in one form; under it, in its own section, its payments to
 * delete and "no pagará" (closed until asked, so the form stays the only one
 * open). The current period, while it has no cost, comes with the cost
 * of the service's licenses prefilled (E11-03): saving confirms it.
 */
export default async function ClientServicePeriodPage({
  params,
  searchParams,
}: PageProps<"/admin/clientes/[id]/servicios/[serviceId]/periodos/[periodId]">) {
  const { id, serviceId, periodId } = await params;
  if (!isUuid(id) || !isUuid(serviceId) || !isUuid(periodId)) notFound();
  const found = await getClientServiceForAdmin(id, serviceId);
  const periods = found?.service.client_service_period ?? [];
  const period = periods.find((candidate) => candidate.id === periodId);
  if (!found || !period) notFound();
  const { client, service } = found;
  const { aviso } = await searchParams;
  const record = adminPaths.clientService(client.id, service.id);
  const purchases = (await getPurchasesForClientServices([service.id])).get(
    service.id,
  );
  const licensesCost =
    purchases && period.id === periods[0]?.id
      ? serviceLicensesCostCents(purchases.licenses, {
          value: service.renews_every_value,
          unit: service.renews_every_unit,
        })
      : null;

  return (
    <div className="flex flex-col gap-8">
      <Notice value={aviso} />
      <FormPage
        title={periodName(period)}
        back={{ href: record, label: `Volver a ${serviceTitle(service)}` }}
      >
        <PeriodForm
          period={period}
          licensesCostCents={licensesCost}
          cancelHref={record}
        />
        <Section title="Pagos">
          <PeriodPayments period={period} />
        </Section>
      </FormPage>
    </div>
  );
}

function PeriodForm({
  period,
  licensesCostCents,
  cancelHref,
}: {
  period: Period;
  licensesCostCents: number | null;
  cancelHref: string;
}) {
  const prefill =
    period.cost_without_vat === 0 && licensesCostCents !== null
      ? licensesCostCents / 100
      : null;
  return (
    <ActionForm
      action={savePeriod}
      submitLabel="Guardar período"
      cancelHref={cancelHref}
    >
      <input type="hidden" name="id" value={period.id} />
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          label="Venta"
          name="sold_on"
          id="sold"
          type="date"
          required
          defaultValue={period.sold_on}
        />
        <FormField
          label="Desde"
          name="starts_on"
          id="starts"
          type="date"
          required
          defaultValue={period.starts_on}
        />
        <FormField
          label="Hasta"
          name="ends_on"
          id="ends"
          type="date"
          defaultValue={period.ends_on ?? ""}
          hint="Vacío: no vence."
        />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <PriceField
          idPrefix="period"
          price={period.price_without_vat}
          vatRate={period.vat_rate}
          previewLabel="Con IVA"
        />
        <FormField
          label="Costo"
          name="cost_without_vat"
          id="cost"
          inputMode="decimal"
          className="w-32"
          defaultValue={formatDecimal(prefill ?? period.cost_without_vat)}
          hint={prefill !== null ? "Costo de sus licencias." : undefined}
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

/** The period's payments, to delete one, and "no pagará" (E11-02). */
function PeriodPayments({ period }: { period: Period }) {
  const { balance } = period;
  const open = balance.status === "pending" || balance.status === "partial";

  return (
    <>
      <p className="font-medium">
        Total con IVA: {formatCents(balance.totalCents)}. {balance.label}
        {balance.status === "written_off" && period.written_off_on
          ? ` desde el ${formatDay(period.written_off_on)}${
              period.write_off_reason ? `: ${period.write_off_reason}` : ""
            }.`
          : "."}
      </p>

      {period.client_payment.length === 0 ? (
        <EmptyState>Todavía no hay pagos.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {period.client_payment.map((payment) => (
            <li key={payment.id} className="flex flex-col gap-2">
              <span className="tabular-nums">
                {formatDay(payment.paid_on)}:{" "}
                {formatCents(toCents(payment.amount))},{" "}
                {PAYMENT_METHOD_LABELS[payment.method]}
                {payment.notes && `. ${payment.notes}`}
              </span>
              <DeleteButton
                action={deletePayment}
                id={payment.id}
                label="Borrar pago"
                question={`¿Borrar el pago de ${formatCents(toCents(payment.amount))} del ${formatDay(payment.paid_on)}?`}
              />
            </li>
          ))}
        </ul>
      )}

      {open && (
        // Closed until asked: the page keeps a single open form (DESIGN §12.2).
        <Disclosure summary="Marcar como no pagará" variant="inline">
          <ConfirmForm
            action={writeOffPeriod}
            label="Marcar como no pagará"
            question="¿Marcar este período como no pagará? Sale de por cobrar y cuenta como pérdida."
            confirmLabel="Sí, marcar"
            cancelLabel="No"
          >
            <input type="hidden" name="id" value={period.id} />
            <FormField
              label="Motivo"
              name="reason"
              id="reason"
              required
              maxLength={300}
              hint="Por ejemplo: cerró el negocio, no responde."
            />
          </ConfirmForm>
        </Disclosure>
      )}

      {period.written_off_on && (
        <ActionForm
          action={clearWriteOff}
          submitLabel={'Quitar "no pagará"'}
          variant="secondary"
        >
          <input type="hidden" name="id" value={period.id} />
        </ActionForm>
      )}
    </>
  );
}
