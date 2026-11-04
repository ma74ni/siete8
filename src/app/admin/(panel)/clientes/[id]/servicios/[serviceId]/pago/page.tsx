import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { FormPage } from "@/components/admin/form-page";
import { FormField } from "@/components/form/form-field";
import { SelectField } from "@/components/form/select-field";
import { isUuid } from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import { periodName, periodToPay, serviceTitle } from "@/lib/client-record";
import { formatDecimal } from "@/lib/clients";
import { todayInQuito } from "@/lib/days";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/payments";
import { formatCents } from "@/lib/price";
import { getClientServiceForAdmin } from "@/server/admin-clients";
import { addPayment } from "@/server/admin-client-payments-actions";

// Texts from docs/COPY.md §13 (Clientes, Pagos).

/**
 * "Registrar pago" (E14-04): a payment for the oldest period that still owes,
 * named on the page. With nothing owed there is nothing to pay: 404.
 */
export default async function ClientServicePaymentPage({
  params,
}: PageProps<"/admin/clientes/[id]/servicios/[serviceId]/pago">) {
  const { id, serviceId } = await params;
  if (!isUuid(id) || !isUuid(serviceId)) notFound();
  const found = await getClientServiceForAdmin(id, serviceId);
  if (!found) notFound();
  const { client, service } = found;
  const period = periodToPay(service.client_service_period);
  if (!period) notFound();
  const record = adminPaths.clientService(client.id, service.id);
  const { balance } = period;

  return (
    <FormPage
      title="Registrar pago"
      back={{ href: record, label: `Volver a ${serviceTitle(service)}` }}
      intro={`${periodName(period)}. Total con IVA: ${formatCents(balance.totalCents)}. ${balance.label}.`}
    >
      <ActionForm
        action={addPayment}
        submitLabel="Registrar pago"
        cancelHref={record}
      >
        <input type="hidden" name="period_id" value={period.id} />
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Fecha"
            name="paid_on"
            id="paid-on"
            type="date"
            required
            defaultValue={todayInQuito()}
          />
          <FormField
            label="Monto con IVA"
            name="amount"
            id="amount"
            inputMode="decimal"
            required
            defaultValue={formatDecimal(balance.balanceCents / 100)}
          />
          <SelectField
            label="Forma de pago"
            id="method"
            name="method"
            defaultValue="transfer"
          >
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
              (method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ),
            )}
          </SelectField>
        </div>
        <FormField label="Notas" name="notes" id="notes" maxLength={1000} />
      </ActionForm>
    </FormPage>
  );
}
