import { CSV_COLUMNS, toCsv } from "@/lib/clients";
import { requireAdmin } from "@/server/auth";

/** Empty import template: only the column names (RF-CRM-07). */
export async function GET() {
  await requireAdmin();
  return new Response(toCsv([[...CSV_COLUMNS]]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-clientes.csv"',
      "Cache-Control": "no-store",
    },
  });
}
