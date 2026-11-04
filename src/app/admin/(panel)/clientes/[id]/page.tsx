import Link from "next/link";
import { notFound } from "next/navigation";

import { DataTable } from "@/components/admin/data-table";
import { Section } from "@/components/admin/fields";
import { KeyFigures } from "@/components/admin/key-figures";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { StatusText } from "@/components/admin/status-text";
import { Button } from "@/components/sitio/button";
import { isUuid } from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import {
  clientSummary,
  type ClientSummary,
  latestPayments,
  paymentNeedsAttention,
  serviceTitle,
} from "@/lib/client-record";
import { CLIENT_KIND_LABELS, expiry, needsAttention } from "@/lib/clients";
import { formatDay, todayInQuito } from "@/lib/days";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments";
import { formatCents, formatPriceWithVat, toCents } from "@/lib/price";
import {
  type ClientForAdmin,
  type ClientServiceForAdmin,
  getClientForAdmin,
} from "@/server/admin-clients";

// Texts from docs/COPY.md §13 (Clientes, Ficha).

/**
 * The client's record (E11-01, E14-04, RF-CRM-02): what they owe, what
 * expires next, their services and last payments, in reading. Every change
 * happens on its own page (DESIGN §12.2, Ficha).
 */
export default async function ClientPage({
  params,
  searchParams,
}: PageProps<"/admin/clientes/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const client = await getClientForAdmin(id);
  if (!client) notFound();
  const { aviso } = await searchParams;
  const today = todayInQuito();

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <Notice value={aviso} />
      <PageHeader
        title={client.name}
        back={{ href: adminPaths.clients, label: "Volver a clientes" }}
        intro={<ClientIntro client={client} />}
        actions={
          <>
            <Button href={adminPaths.newClientService(client.id)}>
              Agregar servicio
            </Button>
            <Button href={adminPaths.editClient(client.id)} variant="secondary">
              Editar datos
            </Button>
          </>
        }
      />

      <Summary summary={clientSummary(client.client_service, today)} />

      <Section title="Servicios">
        <ServicesTable client={client} today={today} />
      </Section>

      <Section title="Últimos pagos">
        <LatestPayments services={client.client_service} />
      </Section>

      {client.notes && (
        <Section title="Notas">
          <p className="max-w-[68ch] whitespace-pre-line">{client.notes}</p>
        </Section>
      )}
    </div>
  );
}

/** "{Tipo}, {RUC o cédula}. {celular}, {correo}." and the lead it came from. */
function ClientIntro({ client }: { client: ClientForAdmin }) {
  const identity = [CLIENT_KIND_LABELS[client.kind], client.tax_id]
    .filter(Boolean)
    .join(", ");
  const contact = [client.phone, client.email].filter(Boolean).join(", ");
  return (
    <>
      {identity}.{contact && ` ${contact}.`}
      {client.lead && (
        <>
          {" "}
          <Link href={adminPaths.lead(client.lead.id)}>Lead de origen</Link>
        </>
      )}
    </>
  );
}

function Summary({ summary }: { summary: ClientSummary }) {
  return (
    <KeyFigures
      items={[
        {
          label: "Debe",
          large: true,
          value:
            summary.owedCents > 0 ? (
              <StatusText tone="alert">
                {formatCents(summary.owedCents)}
              </StatusText>
            ) : (
              "Al día"
            ),
        },
        {
          label: "Próximo vencimiento",
          value: summary.nextExpiry ? (
            <NextExpiry expiry={summary.nextExpiry} />
          ) : (
            "Ninguno"
          ),
        },
        {
          label: "Servicios activos",
          large: true,
          value: summary.activeServices,
        },
      ]}
    />
  );
}

/** "Hosting, 12 de noviembre de 2026", or in red when it already expired. */
function NextExpiry({
  expiry,
}: {
  expiry: NonNullable<ClientSummary["nextExpiry"]>;
}) {
  return expiry.expired ? (
    <StatusText tone="alert">
      {`${expiry.service}, venció el ${formatDay(expiry.day)}`}
    </StatusText>
  ) : (
    `${expiry.service}, ${formatDay(expiry.day)}`
  );
}

/** "Hosting, heladeria.com (cancelado)". */
function serviceName(service: ClientServiceForAdmin) {
  return `${serviceTitle(service)}${service.status === "cancelled" ? " (cancelado)" : ""}`;
}

function ServicesTable({
  client,
  today,
}: {
  client: ClientForAdmin;
  today: string;
}) {
  return (
    <DataTable
      rows={client.client_service}
      rowKey={(service) => service.id}
      label="Servicios"
      empty="Este cliente todavía no tiene servicios."
      minWidth="28rem"
      // What needs attention (Vence, Pago) comes right after the name, so a
      // phone sees it without scrolling the table sideways.
      columns={[
        {
          header: "Servicio",
          rowHeader: true,
          cell: (service) => (
            <Link href={adminPaths.clientService(client.id, service.id)}>
              {serviceName(service)}
            </Link>
          ),
        },
        {
          header: "Vence",
          cell: (service) => {
            const due = expiry(
              service.client_service_period[0]?.ends_on ?? null,
              today,
            );
            return (
              <StatusText
                tone={needsAttention(due, service.status) ? "alert" : "default"}
              >
                {due.label}
              </StatusText>
            );
          },
        },
        {
          header: "Pago",
          cell: (service) => {
            const current = service.client_service_period[0];
            return current ? (
              <StatusText
                tone={
                  paymentNeedsAttention(current, today) ? "alert" : "default"
                }
              >
                {current.balance.label}
              </StatusText>
            ) : (
              "—"
            );
          },
        },
        {
          header: "Precio con IVA",
          numeric: true,
          cell: (service) => {
            const current = service.client_service_period[0];
            return current
              ? formatPriceWithVat(current.price_without_vat, current.vat_rate)
              : "—";
          },
        },
        { header: "Plan", cell: (service) => service.plan?.name ?? "—" },
      ]}
    />
  );
}

function LatestPayments({
  services,
}: {
  services: ClientForAdmin["client_service"];
}) {
  return (
    <DataTable
      rows={latestPayments(services)}
      rowKey={(payment) => payment.id}
      label="Últimos pagos"
      empty="Todavía no hay pagos."
      minWidth="32rem"
      columns={[
        {
          header: "Fecha",
          rowHeader: true,
          cell: (payment) => formatDay(payment.paid_on),
        },
        { header: "Servicio", cell: (payment) => payment.service },
        {
          header: "Forma de pago",
          cell: (payment) => PAYMENT_METHOD_LABELS[payment.method],
        },
        {
          header: "Monto",
          numeric: true,
          emphasis: true,
          cell: (payment) => formatCents(toCents(payment.amount)),
        },
      ]}
    />
  );
}
