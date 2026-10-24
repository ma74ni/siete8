import type { NextRequest } from "next/server";

import { todayInQuito, toCsv } from "@/lib/clients";
import {
  monthlyCsvRows,
  monthlyProfits,
  PROFIT_VIEW_PARAMS,
  profitFilters,
} from "@/lib/profits";
import { getProfitData } from "@/server/admin-profits";

/** The month by month profits of a year and view, as CSV (RF-CRM-08, E11-06). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const currentYear = Number(todayInQuito().slice(0, 4));
  const { year, view } = profitFilters(
    {
      anio: params.get("anio") ?? undefined,
      vista: params.get("vista") ?? undefined,
    },
    currentYear,
  );
  const monthly = monthlyProfits(await getProfitData(), year, view);
  const csv = toCsv(monthlyCsvRows(monthly, year));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ganancias-${year}-${PROFIT_VIEW_PARAMS[view]}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
