import { todayInQuito, toCsv } from "@/lib/clients";
import { exportReceivablesRows } from "@/server/admin-clients";

/** What clients owe, as CSV (RF-CRM-08). */
export async function GET() {
  const today = todayInQuito();
  const csv = toCsv(await exportReceivablesRows(today));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="por-cobrar-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
