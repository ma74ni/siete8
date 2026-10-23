import "server-only";

import {
  CLIENT_SERVICES_SELECT,
  dueReport,
  dueReportCsvRows,
  PURCHASES_SELECT,
} from "@/lib/renewals";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/**
 * Panel reads of "Por vencer" (E11-04). RLS: only admins read these tables.
 * The weekly email builds the same report from the same rows
 * (netlify/functions/weekly-digest.mts).
 */
export async function getDueReport(today: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [services, purchases] = await Promise.all([
    supabase.from("client_service").select(CLIENT_SERVICES_SELECT),
    supabase.from("purchase").select(PURCHASES_SELECT),
  ]);
  const error = services.error ?? purchases.error;
  if (error) throw new Error(`Could not load what is due: ${error.message}`);
  return dueReport(services.data!, purchases.data!, today);
}

export async function exportDueRows(today: string): Promise<string[][]> {
  return dueReportCsvRows(await getDueReport(today));
}
