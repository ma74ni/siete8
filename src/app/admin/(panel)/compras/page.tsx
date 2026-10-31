import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { StatusText } from "@/components/admin/status-text";
import { Button } from "@/components/sitio/button";
import { expiry, needsAttention, todayInQuito } from "@/lib/clients";
import { formatCents } from "@/lib/price";
import { listPurchases } from "@/server/admin-purchases";

// Texts from docs/COPY.md §13.

/** What Siete8 pays its providers and when it renews (E11-03, RF-CRM-14). */
export default async function PurchasesPage() {
  const purchases = await listPurchases();
  const today = todayInQuito();

  return (
    <div className="flex max-w-[72rem] flex-col gap-8">
      <PageHeader
        title="Compras"
        intro="Lo que le pagas a tus proveedores y cuándo se renueva."
        actions={
          <>
            <Button href="/admin/compras/nueva">Nueva compra</Button>
            {/* A file download, not a page: a plain link. */}
            <a
              href="/admin/compras/exportar"
              download
              className="inline-flex min-h-12 items-center"
            >
              Exportar a CSV
            </a>
          </>
        }
      />

      <DataTable
        rows={purchases}
        rowKey={(purchase) => purchase.id}
        label="Compras"
        empty="Todavía no hay compras."
        minWidth="56rem"
        columns={[
          { header: "Proveedor", cell: (purchase) => purchase.provider },
          {
            header: "Concepto",
            // The purchase is named by its concept, which opens it.
            rowHeader: true,
            cell: (purchase) => (
              <>
                <Link href={`/admin/compras/${purchase.id}`}>
                  {purchase.concept}
                </Link>
                {purchase.status === "cancelled" && " (cancelada)"}
              </>
            ),
          },
          { header: "Se carga a", cell: (purchase) => purchase.chargedTo },
          {
            header: "Vence",
            cell: (purchase) => {
              const due = expiry(purchase.expires_on, today);
              return (
                <StatusText
                  tone={
                    needsAttention(due, purchase.status) ? "alert" : "default"
                  }
                >
                  {due.label}
                </StatusText>
              );
            },
          },
          {
            header: "Último pago",
            numeric: true,
            cell: (purchase) =>
              purchase.lastTotalCents === null
                ? "—"
                : formatCents(purchase.lastTotalCents),
          },
          { header: "Renovación", cell: (purchase) => purchase.renewal },
        ]}
      />
    </div>
  );
}
