import Link from "next/link";

import { Button } from "@/components/sitio/button";
import { expiry, todayInQuito } from "@/lib/clients";
import { cx } from "@/lib/cx";
import { formatCents } from "@/lib/price";
import { listPurchases } from "@/server/admin-purchases";

// Texts from docs/COPY.md §13.

/** What Siete8 pays its providers and when it renews (E11-03, RF-CRM-14). */
export default async function PurchasesPage() {
  const purchases = await listPurchases();
  const today = todayInQuito();

  return (
    <div className="flex max-w-[72rem] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2">Compras</h1>
        <p>Lo que le pagas a tus proveedores y cuándo se renueva.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button href="/admin/compras/nueva">Nueva compra</Button>
        {/* A file download, not a page: a plain link. */}
        <a
          href="/admin/compras/exportar"
          download
          className="inline-flex min-h-12 items-center"
        >
          Exportar a CSV
        </a>
      </div>

      {purchases.length === 0 ? (
        <p>Todavía no hay compras.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Proveedor",
                  "Concepto",
                  "Se carga a",
                  "Vence",
                  "Último pago",
                  "Renovación",
                ].map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="py-3 pr-4 font-medium"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const cancelled = purchase.status === "cancelled";
                const due = expiry(purchase.expires_on, today);
                return (
                  <tr
                    key={purchase.id}
                    className="border-b border-border align-top"
                  >
                    <td className="py-3 pr-4">{purchase.provider}</td>
                    <td className="py-3 pr-4">
                      <Link href={`/admin/compras/${purchase.id}`}>
                        {purchase.concept}
                      </Link>
                      {cancelled && " (cancelada)"}
                    </td>
                    <td className="py-3 pr-4">{purchase.chargedTo}</td>
                    <td
                      className={cx(
                        "py-3 pr-4",
                        !cancelled &&
                          due.state === "expired" &&
                          "font-medium text-accent",
                      )}
                    >
                      {due.label}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {purchase.lastTotalCents === null
                        ? "—"
                        : formatCents(purchase.lastTotalCents)}
                    </td>
                    <td className="py-3">{purchase.renewal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
