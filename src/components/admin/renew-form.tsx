import { ActionForm } from "@/components/admin/action-form";
import { Disclosure } from "@/components/admin/disclosure";
import { PriceField } from "@/components/admin/price-field";
import { FormField } from "@/components/form/form-field";
import { formatDecimal } from "@/lib/clients";
import type { NextPeriod } from "@/lib/renewals";
import { renewClientService } from "@/server/admin-client-services-actions";

// Texts from docs/COPY.md §13 (Clientes, Renovar).

/**
 * The fields of "Renovar" (E11-04, RF-CRM-13): the next period of a client
 * service, prefilled with the previous price and cost and editable before
 * saving. In "Por vencer" they open in the row; in the client's service, on
 * their own page (E14-04).
 */
export function RenewFields({
  serviceId,
  next,
}: {
  serviceId: string;
  next: NextPeriod;
}) {
  const key = `renew-${serviceId}`;
  return (
    <>
      <input type="hidden" name="client_service_id" value={serviceId} />
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          label="Fecha de venta"
          name="sold_on"
          id={`${key}-sold`}
          type="date"
          required
          defaultValue={next.sold_on}
        />
        <FormField
          label="Desde"
          name="starts_on"
          id={`${key}-starts`}
          type="date"
          required
          defaultValue={next.starts_on}
        />
        <FormField
          label="Hasta"
          name="ends_on"
          id={`${key}-ends`}
          type="date"
          required
          defaultValue={next.ends_on}
        />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <PriceField
          idPrefix={key}
          price={next.price_without_vat}
          vatRate={next.vat_rate}
          previewLabel="Con IVA"
        />
        <FormField
          label="Costo sin IVA"
          name="cost_without_vat"
          id={`${key}-cost`}
          inputMode="decimal"
          className="w-32"
          defaultValue={formatDecimal(next.cost_without_vat)}
        />
      </div>
    </>
  );
}

/** "Renovar" opened in a row of "Por vencer"; the list stays after saving. */
export function RenewForm({
  serviceId,
  next,
}: {
  serviceId: string;
  next: NextPeriod;
}) {
  return (
    <Disclosure summary="Renovar" variant="action">
      <ActionForm
        action={renewClientService}
        submitLabel="Renovar servicio"
        // A new period moves the next one forward: the fields follow it.
        resetKey={next.starts_on}
      >
        <RenewFields serviceId={serviceId} next={next} />
      </ActionForm>
    </Disclosure>
  );
}
