import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { Section } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { RenewForm } from "@/components/admin/renew-form";
import { StatusText } from "@/components/admin/status-text";
import { todayInQuito } from "@/lib/clients";
import { formatCents } from "@/lib/price";
import { getDueReport } from "@/server/admin-renewals";

// Texts from docs/COPY.md §13.

/**
 * What expires in the next 30 days or already expired, for clients and
 * providers, with the cross alerts first (E11-04, RF-CRM-12, 13, 15, 16).
 */
export default async function DuePage() {
  const today = todayInQuito();
  const { alerts, clients, purchases } = await getDueReport(today);

  return (
    <div className="flex max-w-[72rem] flex-col gap-8">
      <PageHeader
        title="Por vencer"
        intro="Lo que vence en los próximos 30 días y lo que ya venció, de tus clientes y de tus proveedores."
        actions={
          // A file download, not a page: a plain link.
          <a
            href="/admin/por-vencer/exportar"
            download
            className="inline-flex min-h-12 items-center"
          >
            Exportar a CSV
          </a>
        }
      />

      {alerts.length > 0 && (
        <Section title="Revisa antes de renovar">
          <p>Compras y licencias que quizá ya no debas pagar.</p>
          <ul className="flex flex-col border-t border-border">
            {alerts.map((alert, index) => (
              <li key={index} className="border-b border-border py-3">
                <Link href={`/admin/compras/${alert.purchaseId}`}>
                  {alert.text}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Tus clientes">
        <p>
          Servicios que vencen en los próximos 30 días o ya vencieron, del más
          atrasado al más próximo.
        </p>
        <DataTable
          rows={clients}
          rowKey={(row) => row.id}
          label="Tus clientes"
          empty="Ningún servicio de tus clientes vence en los próximos 30 días."
          // "Renovar" opens under its service, as wide as the screen.
          details={(row) =>
            row.next ? <RenewForm serviceId={row.id} next={row.next} /> : null
          }
          columns={[
            {
              header: "Cliente",
              rowHeader: true,
              cell: (row) =>
                row.clientId ? (
                  <Link
                    href={`/admin/clientes/${row.clientId}#servicio-${row.id}`}
                  >
                    {row.client}
                  </Link>
                ) : (
                  row.client
                ),
            },
            { header: "Servicio", cell: (row) => row.service },
            {
              header: "Vence",
              cell: (row) => (
                <StatusText tone={row.expired ? "alert" : "default"}>
                  {row.expiry}
                </StatusText>
              ),
            },
            { header: "Pago", cell: (row) => row.payment },
            {
              header: "Precio con IVA",
              cell: (row) => formatCents(row.priceWithVatCents),
              numeric: true,
            },
          ]}
        />
      </Section>

      <Section title="Tus proveedores">
        <p>Compras que vencen en los próximos 30 días o ya vencieron.</p>
        <DataTable
          rows={purchases}
          rowKey={(row) => row.id}
          label="Tus proveedores"
          empty="No tienes pagos a proveedores en los próximos 30 días."
          minWidth="52rem"
          columns={[
            {
              header: "Proveedor",
              rowHeader: true,
              cell: (row) => row.provider,
            },
            {
              header: "Concepto",
              cell: (row) => (
                <>
                  {row.concept}
                  {row.autoRenew && (
                    <span className="block text-small">
                      Se cobra sola: cancélala a tiempo si ya no la necesitas.
                    </span>
                  )}
                </>
              ),
            },
            { header: "Se carga a", cell: (row) => row.chargedTo },
            {
              header: "Vence",
              cell: (row) => (
                <StatusText tone={row.expired ? "alert" : "default"}>
                  {row.expiry}
                </StatusText>
              ),
            },
            { header: "Renovación", cell: (row) => row.renewal },
            {
              header: "Acción",
              hideHeader: true,
              cell: (row) => (
                <Link href={`/admin/compras/${row.id}`}>Registrar pago</Link>
              ),
            },
          ]}
        />
      </Section>
    </div>
  );
}
