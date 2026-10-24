import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { DataTable } from "@/components/admin/data-table";
import { Section } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { FormField } from "@/components/sitio/form-field";
import { formatDayShort, todayInQuito } from "@/lib/clients";
import { ageLabel } from "@/lib/payments";
import { formatCents } from "@/lib/price";
import { listReceivables } from "@/server/admin-clients";
import { markPaidBefore, markPaidToday } from "@/server/admin-clients-actions";

// Texts from docs/COPY.md §13.

/** What clients owe, oldest sale first (E11-02, RF-CRM-11). */
export default async function ReceivablesPage() {
  const today = todayInQuito();
  const { rows, totalCents } = await listReceivables(today);

  return (
    <div className="flex max-w-[72rem] flex-col gap-8">
      <PageHeader
        title="Por cobrar"
        intro="Lo que te deben tus clientes, del más antiguo al más reciente."
        actions={
          rows.length > 0 && (
            // A file download, not a page: a plain link.
            <a
              href="/admin/por-cobrar/exportar"
              download
              className="inline-flex min-h-12 items-center"
            >
              Exportar a CSV
            </a>
          )
        }
      />

      {rows.length > 0 && (
        <p className="text-h4">
          Total por cobrar: {formatCents(totalCents)} en{" "}
          {rows.length === 1 ? "1 período" : `${rows.length} períodos`}.
        </p>
      )}
      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        label="Por cobrar"
        empty="Nadie te debe nada."
        minWidth="56rem"
        columns={[
          {
            header: "Cliente",
            rowHeader: true,
            cell: (row) =>
              row.client ? (
                <Link href={`/admin/clientes/${row.client.id}`}>
                  {row.client.name}
                </Link>
              ) : (
                "—"
              ),
          },
          {
            header: "Servicio",
            cell: (row) => [row.service, row.detail].filter(Boolean).join(", "),
          },
          {
            header: "Venta",
            cell: (row) => formatDayShort(row.sold_on),
            numeric: true,
          },
          {
            header: "Total",
            cell: (row) => formatCents(row.balance.totalCents),
            numeric: true,
          },
          {
            header: "Pagado",
            cell: (row) => formatCents(row.balance.paidCents),
            numeric: true,
          },
          {
            header: "Saldo",
            cell: (row) => formatCents(row.balance.balanceCents),
            numeric: true,
            emphasis: true,
          },
          { header: "Antigüedad", cell: (row) => ageLabel(row.days) },
          {
            header: "Acción",
            hideHeader: true,
            compact: true,
            cell: (row) => (
              <ActionForm
                action={markPaidToday}
                submitLabel="Pagado hoy"
                variant="secondary"
              >
                <input type="hidden" name="period_id" value={row.id} />
              </ActionForm>
            ),
          },
        ]}
      />

      <Section title="Marcar como pagados los períodos anteriores">
        <p className="max-w-[68ch]">
          Para los clientes que cargaste antes de registrar pagos: el saldo de
          cada período vendido antes de esta fecha se registra como pagado en su
          fecha de venta.
        </p>
        <ConfirmForm
          action={markPaidBefore}
          label="Marcar como pagados"
          question="¿Marcar como pagados todos los períodos con saldo vendidos antes de esa fecha? No se puede deshacer de una vez."
          confirmLabel="Sí, marcar"
        >
          <FormField
            label="Vendidos antes del"
            name="before"
            id="paid-before"
            type="date"
            required
            className="max-w-[16rem]"
            defaultValue={today}
          />
        </ConfirmForm>
      </Section>
    </div>
  );
}
