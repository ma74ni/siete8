import { toCsv } from "@/lib/csv";
import { todayInQuito } from "@/lib/days";
import { exportClientsRows } from "@/server/admin-clients";

/** The clients list as CSV, in the import format (RF-CRM-08). */
export async function GET() {
  const csv = toCsv(await exportClientsRows());
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${todayInQuito()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
