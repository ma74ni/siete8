import { todayInQuito, toCsv } from "@/lib/clients";
import { exportPurchasesRows } from "@/server/admin-purchases";

/** The purchases as CSV (RF-CRM-08). */
export async function GET() {
  const csv = toCsv(await exportPurchasesRows());
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="compras-${todayInQuito()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
