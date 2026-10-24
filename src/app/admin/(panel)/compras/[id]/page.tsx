import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { DataTable } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { Disclosure } from "@/components/admin/disclosure";
import { EmptyState } from "@/components/admin/empty-state";
import { Section, SelectField } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import {
  PurchaseFields,
  PurchasePaymentFields,
} from "@/components/admin/purchase-fields";
import { FormField } from "@/components/sitio/form-field";
import { isUuid } from "@/lib/admin-forms";
import {
  addPeriod,
  formatDay,
  formatDecimal,
  todayInQuito,
} from "@/lib/clients";
import { formatCents, toCents } from "@/lib/price";
import { licenseUseLabel, paymentTotalCents } from "@/lib/purchases";
import {
  getPurchase,
  getPurchaseOptions,
  type PurchaseForAdmin,
} from "@/server/admin-purchases";
import {
  addPurchasePayment,
  assignLicense,
  cancelPurchase,
  deletePurchase,
  deletePurchasePayment,
  reactivatePurchase,
  removeLicense,
  updatePurchase,
} from "@/server/admin-purchases-actions";

// Texts from docs/COPY.md §13.

/** One purchase: its payments, licenses and data (E11-03, RF-CRM-14). */
export default async function PurchasePage({
  params,
}: PageProps<"/admin/compras/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [purchase, options] = await Promise.all([
    getPurchase(id),
    getPurchaseOptions(),
  ]);
  if (!purchase) notFound();

  return (
    <div className="flex max-w-[72rem] flex-col gap-10">
      <PageHeader
        title={purchase.concept}
        back={{ href: "/admin/compras", label: "Volver a compras" }}
        intro={
          <>
            {purchase.provider?.name}
            {purchase.status === "cancelled" && " (cancelada)"}
            {purchase.auto_renew && purchase.status === "active" && (
              <span className="mt-2 block font-medium">
                Se renueva sola: cancélala a tiempo si ya no la necesitas.
              </span>
            )}
          </>
        }
      />

      <Section title="Pagos">
        <Payments purchase={purchase} />
        <NextPayment purchase={purchase} />
      </Section>

      {(purchase.quantity > 1 || purchase.license_assignment.length > 0) && (
        <Section title="Licencias">
          <Licenses
            purchase={purchase}
            clientServices={options.clientServices}
          />
        </Section>
      )}

      <Section title="Datos de la compra">
        <ActionForm
          action={updatePurchase}
          submitLabel="Guardar compra"
          resetKey={purchase.updated_at}
        >
          <input type="hidden" name="id" value={purchase.id} />
          <PurchaseFields
            {...options}
            purchase={{
              ...purchase,
              service_ids: purchase.purchase_service.map((s) => s.service_id),
            }}
          />
        </ActionForm>
      </Section>

      <div className="flex flex-col gap-4 border-t border-border pt-8">
        {purchase.status === "active" ? (
          <DeleteButton
            action={cancelPurchase}
            id={purchase.id}
            label="Cancelar compra"
            question={`¿Cancelar ${purchase.concept}? Deja de aparecer en por vencer; sus pagos se conservan.`}
            confirmLabel="Sí, cancelar"
            cancelLabel="No"
          />
        ) : (
          <ActionForm
            action={reactivatePurchase}
            submitLabel="Reactivar compra"
            variant="secondary"
          >
            <input type="hidden" name="id" value={purchase.id} />
          </ActionForm>
        )}
        <DeleteButton
          action={deletePurchase}
          id={purchase.id}
          label="Borrar compra"
          question={`¿Borrar ${purchase.concept}? Se borran también sus pagos y licencias, y no se puede deshacer. Si ya no la usas, mejor cancélala.`}
        />
      </div>
    </div>
  );
}

function Payments({ purchase }: { purchase: PurchaseForAdmin }) {
  return (
    <DataTable
      rows={purchase.purchase_payment}
      rowKey={(payment) => payment.id}
      label="Pagos"
      empty="Todavía no hay pagos."
      minWidth="52rem"
      columns={[
        {
          header: "Fecha",
          rowHeader: true,
          cell: (payment) => formatDay(payment.paid_on),
        },
        {
          header: "Cubre",
          cell: (payment) =>
            `${formatDay(payment.covers_from)}${
              payment.covers_to
                ? ` al ${formatDay(payment.covers_to)}`
                : ", sin vencimiento"
            }`,
        },
        {
          header: "Cantidad",
          numeric: true,
          cell: (payment) => payment.quantity,
        },
        {
          header: "Plataforma",
          numeric: true,
          cell: (payment) => formatCents(toCents(payment.amount)),
        },
        {
          header: "IVA",
          numeric: true,
          cell: (payment) => formatCents(toCents(payment.vat_amount)),
        },
        {
          header: "ISD",
          numeric: true,
          cell: (payment) => formatCents(toCents(payment.isd_amount)),
        },
        {
          header: "Total",
          numeric: true,
          emphasis: true,
          cell: (payment) => formatCents(paymentTotalCents(payment)),
        },
        {
          header: "Acción",
          hideHeader: true,
          compact: true,
          cell: (payment) => {
            const total = formatCents(paymentTotalCents(payment));
            return (
              <DeleteButton
                action={deletePurchasePayment}
                id={payment.id}
                label="Borrar pago"
                question={`¿Borrar el pago de ${total} del ${formatDay(payment.paid_on)}?`}
              />
            );
          },
        },
      ]}
    />
  );
}

/** "Registrar pago", prefilled with the period after the last one. */
function NextPayment({ purchase }: { purchase: PurchaseForAdmin }) {
  const today = todayInQuito();
  const last = purchase.purchase_payment[0];
  const from = last?.covers_to ?? today;
  const to =
    purchase.renews_every_unit && purchase.renews_every_value
      ? addPeriod(from, purchase.renews_every_value, purchase.renews_every_unit)
      : "";
  return (
    <Disclosure summary="Registrar pago">
      <ActionForm
        action={addPurchasePayment}
        submitLabel="Registrar pago"
        resetKey={String(purchase.purchase_payment.length)}
      >
        <input type="hidden" name="purchase_id" value={purchase.id} />
        <PurchasePaymentFields
          idPrefix="next-payment"
          defaults={{
            paid_on: today,
            covers_from: from,
            covers_to: to,
            quantity: purchase.quantity,
            amount: formatDecimal(
              (toCents(purchase.unit_cost) * purchase.quantity) / 100,
            ),
          }}
        />
      </ActionForm>
    </Disclosure>
  );
}

function Licenses({
  purchase,
  clientServices,
}: {
  purchase: PurchaseForAdmin;
  clientServices: { id: string; label: string }[];
}) {
  return (
    <>
      <p className="font-medium">Licencias: {licenseUseLabel(purchase.use)}</p>
      {purchase.license_assignment.length === 0 ? (
        <EmptyState>Todavía no asignas licencias.</EmptyState>
      ) : (
        <ul className="flex flex-col border-t border-border">
          {purchase.license_assignment.map((license) => (
            <li
              key={license.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2"
            >
              <span>
                {[license.email, license.clientLabel]
                  .filter(Boolean)
                  .join(", ")}
              </span>
              <DeleteButton
                action={removeLicense}
                id={license.id}
                label="Quitar licencia"
                question={`¿Quitar la licencia de ${license.email ?? license.clientLabel}?`}
                confirmLabel="Sí, quitar"
              />
            </li>
          ))}
        </ul>
      )}
      <Disclosure summary="Asignar licencia">
        <ActionForm
          action={assignLicense}
          submitLabel="Asignar licencia"
          resetKey={String(purchase.license_assignment.length)}
        >
          <input type="hidden" name="purchase_id" value={purchase.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Correo"
              name="email"
              id="license-email"
              type="email"
              hint="Opcional si eliges un cliente."
            />
            <SelectField
              label="Cliente y servicio"
              id="license-client-service"
              name="client_service_id"
              defaultValue=""
            >
              <option value="">Ninguno</option>
              {clientServices.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.label}
                </option>
              ))}
            </SelectField>
          </div>
        </ActionForm>
      </Disclosure>
    </>
  );
}
