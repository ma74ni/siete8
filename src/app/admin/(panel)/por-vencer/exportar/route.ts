import { todayInQuito, toCsv } from "@/lib/clients";
import { exportDueRows } from "@/server/admin-renewals";

/** What is due in the next 30 days, as CSV (RF-CRM-08, E11-04). */
export async function GET() {
  const today = todayInQuito();
  const csv = toCsv(await exportDueRows(today));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="por-vencer-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
