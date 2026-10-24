import Link from "next/link";

import { Section } from "@/components/admin/fields";
import { RenewForm } from "@/components/admin/renew-form";
import { todayInQuito } from "@/lib/clients";
import { cx } from "@/lib/cx";
import { formatCents } from "@/lib/price";
import { getDueReport } from "@/server/admin-renewals";

// Texts from docs/COPY.md §13.

const cell = "py-3 pr-4";

/**
 * What expires in the next 30 days or already expired, for clients and
 * providers, with the cross alerts first (E11-04, RF-CRM-12, 13, 15, 16).
 */
export default async function DuePage() {
  const today = todayInQuito();
  const { alerts, clients, purchases } = await getDueReport(today);

  return (
    <div className="flex max-w-[72rem] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2">Por vencer</h1>
        <p>
          Lo que vence en los próximos 30 días y lo que ya venció, de tus
          clientes y de tus proveedores.
        </p>
      </div>
      {/* A file download, not a page: a plain link. */}
      <a
        href="/admin/por-vencer/exportar"
        download
        className="inline-flex min-h-12 items-center self-start"
      >
        Exportar a CSV
      </a>

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
        {clients.length === 0 ? (
          <p>Ningún servicio de tus clientes vence en los próximos 30 días.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Cliente",
                    "Servicio",
                    "Vence",
                    "Pago",
                    "Precio con IVA",
                  ].map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className={cx(cell, "font-medium")}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              {clients.map((row) => (
                // One body per service: its data and, below, "Renovar".
                <tbody key={row.id} className="border-b border-border">
                  <tr className="align-top">
                    <td className={cell}>
                      {row.clientId ? (
                        <Link
                          href={`/admin/clientes/${row.clientId}#servicio-${row.id}`}
                        >
                          {row.client}
                        </Link>
                      ) : (
                        row.client
                      )}
                    </td>
                    <td className={cell}>{row.service}</td>
                    <td
                      className={cx(
                        cell,
                        row.expired && "font-medium text-accent",
                      )}
                    >
                      {row.expiry}
                    </td>
                    <td className={cell}>{row.payment}</td>
                    <td className={cx(cell, "tabular-nums")}>
                      {formatCents(row.priceWithVatCents)}
                    </td>
                  </tr>
                  {row.next && (
                    <tr>
                      <td colSpan={5} className="pb-3">
                        <RenewForm serviceId={row.id} next={row.next} />
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </Section>

      <Section title="Tus proveedores">
        <p>Compras que vencen en los próximos 30 días o ya vencieron.</p>
        {purchases.length === 0 ? (
          <p>No tienes pagos a proveedores en los próximos 30 días.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Proveedor",
                    "Concepto",
                    "Se carga a",
                    "Vence",
                    "Renovación",
                    "",
                  ].map((column, index) => (
                    <th
                      key={index}
                      scope="col"
                      className={cx(cell, "font-medium")}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.map((row) => (
                  <tr key={row.id} className="border-b border-border align-top">
                    <td className={cell}>{row.provider}</td>
                    <td className={cell}>
                      {row.concept}
                      {row.autoRenew && (
                        <span className="block text-small">
                          Se cobra sola: cancélala a tiempo si ya no la
                          necesitas.
                        </span>
                      )}
                    </td>
                    <td className={cell}>{row.chargedTo}</td>
                    <td
                      className={cx(
                        cell,
                        row.expired && "font-medium text-accent",
                      )}
                    >
                      {row.expiry}
                    </td>
                    <td className={cell}>{row.renewal}</td>
                    <td className="py-3">
                      <Link href={`/admin/compras/${row.id}`}>
                        Registrar pago
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
