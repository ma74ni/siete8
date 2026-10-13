import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { Section } from "@/components/admin/fields";
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
      <div className="flex flex-col gap-2">
        <h1 className="text-h2">Por cobrar</h1>
        <p>Lo que te deben tus clientes, del más antiguo al más reciente.</p>
      </div>

      {rows.length === 0 ? (
        <p>Nadie te debe nada.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <p className="text-h4">
              Total por cobrar: {formatCents(totalCents)} en{" "}
              {rows.length === 1 ? "1 período" : `${rows.length} períodos`}.
            </p>
            {/* A file download, not a page: a plain link. */}
            <a
              href="/admin/por-cobrar/exportar"
              download
              className="inline-flex min-h-12 items-center"
            >
              Exportar a CSV
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Cliente",
                    "Servicio",
                    "Venta",
                    "Total",
                    "Pagado",
                    "Saldo",
                    "Antigüedad",
                    "",
                  ].map((column, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="py-3 pr-4 font-medium"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border align-top">
                    <td className="py-3 pr-4">
                      {row.client ? (
                        <Link href={`/admin/clientes/${row.client.id}`}>
                          {row.client.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {[row.service, row.detail].filter(Boolean).join(", ")}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {formatDayShort(row.sold_on)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {formatCents(row.balance.totalCents)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {formatCents(row.balance.paidCents)}
                    </td>
                    <td className="py-3 pr-4 font-medium tabular-nums">
                      {formatCents(row.balance.balanceCents)}
                    </td>
                    <td className="py-3 pr-4">{ageLabel(row.days)}</td>
                    <td className="py-1">
                      <ActionForm
                        action={markPaidToday}
                        submitLabel="Pagado hoy"
                        variant="secondary"
                      >
                        <input type="hidden" name="period_id" value={row.id} />
                      </ActionForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

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
