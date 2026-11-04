import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { DataTable } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { Section } from "@/components/admin/fields";
import { KeyFigures } from "@/components/admin/key-figures";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { StatusText } from "@/components/admin/status-text";
import { Button } from "@/components/sitio/button";
import { isUuid } from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import {
  latestPayments,
  owedCents,
  paymentNeedsAttention,
  periodName,
  periodToPay,
  serviceTitle,
} from "@/lib/client-record";
import { expiry, needsAttention, renewalText } from "@/lib/clients";
import { formatDay, todayInQuito } from "@/lib/days";
import { formatPostDate } from "@/lib/blog";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments";
import { formatCents, formatPriceWithVat, toCents } from "@/lib/price";
import { renewalOf } from "@/lib/renewals";
import {
  type ClientServiceForAdmin,
  getClientServiceForAdmin,
} from "@/server/admin-clients";
import { markPaidTodayFromPage } from "@/server/admin-client-payments-actions";
import {
  cancelClientService,
  reactivateClientService,
} from "@/server/admin-client-services-actions";
import {
  type ClientServicePurchases,
  getPurchasesForClientServices,
} from "@/server/admin-purchases";

// Texts from docs/COPY.md §13 (Clientes, Servicio del cliente).

type Period = ClientServiceForAdmin["client_service_period"][number];

/**
 * One of the client's services (E14-04): its state, its history and its
 * payments, in reading. Renovar, Registrar pago and Editar servicio each have
 * their own page; "Pagado hoy" is a one-button action; Cancelar sits apart.
 */
export default async function ClientServicePage({
  params,
  searchParams,
}: PageProps<"/admin/clientes/[id]/servicios/[serviceId]">) {
  const { id, serviceId } = await params;
  if (!isUuid(id) || !isUuid(serviceId)) notFound();
  const found = await getClientServiceForAdmin(id, serviceId);
  if (!found) notFound();
  const { client, service } = found;
  const { aviso } = await searchParams;
  const today = todayInQuito();
  const purchases = (await getPurchasesForClientServices([service.id])).get(
    service.id,
  );
  const periods = service.client_service_period;
  const current = periods[0] ?? null;
  const next = renewalOf(service, today);
  const toPay = periodToPay(periods);
  const owed = owedCents(periods);
  const title = serviceTitle(service);

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <Notice value={aviso} />
      <PageHeader
        title={title}
        back={{
          href: adminPaths.client(client.id),
          label: `Volver a ${client.name}`,
        }}
        intro={<ServiceIntro service={service} current={current} />}
        actions={
          <>
            {next && (
              <Button
                href={adminPaths.renewClientService(client.id, service.id)}
              >
                Renovar
              </Button>
            )}
            {toPay && (
              <Button
                href={adminPaths.clientServicePayment(client.id, service.id)}
                variant="secondary"
              >
                Registrar pago
              </Button>
            )}
            <Button
              href={adminPaths.editClientService(client.id, service.id)}
              variant="secondary"
            >
              Editar servicio
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <KeyFigures
          items={[
            {
              label: "Vence",
              value: (
                <ExpiryText service={service} current={current} today={today} />
              ),
            },
            {
              label: "Debe",
              large: true,
              value:
                owed > 0 ? (
                  <StatusText tone="alert">{formatCents(owed)}</StatusText>
                ) : (
                  "Al día"
                ),
            },
          ]}
        />
        {toPay && (
          <ActionForm
            action={markPaidTodayFromPage}
            submitLabel="Pagado hoy"
            variant="secondary"
          >
            <input type="hidden" name="period_id" value={toPay.id} />
          </ActionForm>
        )}
      </div>

      {/* Each period and payment opens the period's page, where it is
          edited and its payments deleted; the link is the first column, so a
          phone reaches it without scrolling the table sideways. */}
      <Section title="Historial">
        <DataTable
          rows={periods}
          rowKey={(period) => period.id}
          label="Historial"
          empty="Todavía no hay períodos."
          minWidth="28rem"
          columns={[
            {
              header: "Desde",
              rowHeader: true,
              cell: (period) => (
                <Link
                  href={adminPaths.clientServicePeriod(
                    client.id,
                    service.id,
                    period.id,
                  )}
                  aria-label={periodName(period)}
                >
                  {formatDay(period.starts_on)}
                </Link>
              ),
            },
            {
              header: "Pago",
              cell: (period) => (
                <StatusText
                  tone={
                    paymentNeedsAttention(period, today) ? "alert" : "default"
                  }
                >
                  {period.balance.label}
                </StatusText>
              ),
            },
            {
              header: "Hasta",
              cell: (period) =>
                period.ends_on ? formatDay(period.ends_on) : "Sin vencimiento",
            },
            {
              header: "Con IVA",
              numeric: true,
              cell: (period) => formatCents(period.balance.totalCents),
            },
          ]}
        />
      </Section>

      <Section title="Pagos">
        <DataTable
          rows={latestPayments([service], Infinity)}
          rowKey={(payment) => payment.id}
          label="Pagos"
          empty="Todavía no hay pagos."
          minWidth="20rem"
          columns={[
            {
              header: "Fecha",
              rowHeader: true,
              cell: (payment) => (
                <Link
                  href={adminPaths.clientServicePeriod(
                    client.id,
                    service.id,
                    payment.periodId,
                  )}
                >
                  {formatDay(payment.paid_on)}
                </Link>
              ),
            },
            {
              header: "Monto",
              numeric: true,
              emphasis: true,
              cell: (payment) => formatCents(toCents(payment.amount)),
            },
            {
              header: "Forma de pago",
              cell: (payment) => PAYMENT_METHOD_LABELS[payment.method],
            },
          ]}
        />
      </Section>

      {purchases && <ServicePurchases purchases={purchases} />}

      {service.notes && (
        <Section title="Notas">
          <p className="max-w-[68ch] whitespace-pre-line">{service.notes}</p>
        </Section>
      )}

      <div className="border-t border-border pt-8">
        {service.status === "active" ? (
          <DeleteButton
            action={cancelClientService}
            id={service.id}
            label="Cancelar servicio"
            question={`¿Cancelar ${title} de ${client.name}? Deja de aparecer en por vencer; su historial se conserva.`}
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
    </div>
  );
}

/** "Se renueva cada 1 año. Precio con IVA: $113,85." and when it was cancelled. */
function ServiceIntro({
  service,
  current,
}: {
  service: ClientServiceForAdmin;
  current: Period | null;
}) {
  const renewal = renewalText(
    service.renews_every_value,
    service.renews_every_unit,
  );
  return (
    <>
      {service.renews_every_unit
        ? `Se renueva cada ${renewal}.`
        : `${renewal}.`}
      {current &&
        ` Precio con IVA: ${formatPriceWithVat(current.price_without_vat, current.vat_rate)}.`}
      {service.status === "cancelled" &&
        service.cancelled_at &&
        ` Cancelado el ${formatPostDate(service.cancelled_at)}.`}
    </>
  );
}

function ExpiryText({
  service,
  current,
  today,
}: {
  service: ClientServiceForAdmin;
  current: Period | null;
  today: string;
}) {
  const due = expiry(current?.ends_on ?? null, today);
  return (
    <StatusText
      tone={needsAttention(due, service.status) ? "alert" : "default"}
    >
      {due.label}
    </StatusText>
  );
}

/** What this service needs from providers (E11-03): its purchases and licenses. */
function ServicePurchases({
  purchases,
}: {
  purchases: ClientServicePurchases;
}) {
  return (
    <div className="flex flex-col gap-2">
      {purchases.purchases.map((purchase) => (
        <p key={purchase.id}>
          Compras:{" "}
          <Link href={adminPaths.purchase(purchase.id)}>
            {purchase.concept}
          </Link>{" "}
          en {purchase.provider}
          {purchase.cancelled
            ? " (cancelada)"
            : purchase.expires_on
              ? `, vence el ${formatDay(purchase.expires_on)}`
              : ""}
          .
        </p>
      ))}
      {purchases.licenses.map((license) => (
        <p key={license.purchaseId}>
          Licencias: {license.count} de{" "}
          <Link href={adminPaths.purchase(license.purchaseId)}>
            {license.concept}
          </Link>
          {license.emails.length > 0 && ` (${license.emails.join(", ")})`}
          {license.unitCostCents !== null &&
            `, ${formatCents(license.unitCostCents * license.count)}${
              license.cycle ? ` por ${license.cycle}` : ""
            } con impuestos`}
          .
        </p>
      ))}
      {purchases.licenses.length > 0 && (
        <p className="text-small">
          Se precarga como costo del período si está vacío.
        </p>
      )}
    </div>
  );
}
