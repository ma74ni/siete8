import { ActionForm } from "@/components/admin/action-form";
import { PageHeader } from "@/components/admin/page-header";
import {
  PurchaseFields,
  PurchasePaymentFields,
} from "@/components/admin/purchase-fields";
import { addPeriod, todayInQuito } from "@/lib/clients";
import { getPurchaseOptions } from "@/server/admin-purchases";
import { createPurchase } from "@/server/admin-purchases-actions";

// Texts from docs/COPY.md §13.

/** New purchase with its first payment (RF-CRM-14). */
export default async function NewPurchasePage() {
  const options = await getPurchaseOptions();
  const today = todayInQuito();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title="Nueva compra"
        back={{ href: "/admin/compras", label: "Volver a compras" }}
      />
      <ActionForm action={createPurchase} submitLabel="Crear compra">
        <PurchaseFields {...options} />
        <fieldset className="flex flex-col gap-4 border-t border-border pt-6">
          <legend className="sr-only">Primer pago</legend>
          <h2 className="text-h3">Primer pago</h2>
          <p>
            Opcional: si ya la pagaste, registra el último pago para saber
            cuándo vence.
          </p>
          <PurchasePaymentFields
            idPrefix="first-payment"
            defaults={{
              paid_on: today,
              covers_from: today,
              covers_to: addPeriod(today, 1, "year"),
              quantity: 1,
              amount: "",
            }}
          />
        </fieldset>
      </ActionForm>
    </div>
  );
}
