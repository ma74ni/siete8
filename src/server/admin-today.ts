import "server-only";

import { dueThisWeek, owedByClient, TODAY_ROWS } from "@/lib/today";
import { requireAdmin } from "@/server/auth";
import { listReceivables } from "@/server/admin-clients";
import { getDueReport } from "@/server/admin-renewals";
import { createSessionClient } from "@/server/supabase/session";

/**
 * Panel reads of Hoy (E14-03). Due and owed come from the same reads as Por
 * vencer and Por cobrar; leads and proformas are the ones still waiting.
 * RLS: only admins read these tables.
 */
export async function getTodayReport(today: string) {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [due, receivables, leads, proformas] = await Promise.all([
    getDueReport(today),
    listReceivables(today),
    supabase
      .from("lead")
      .select("id, name, source, created_at, service(name)")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(TODAY_ROWS),
    supabase
      .from("proforma")
      .select(
        "id, sent_on, price_without_vat, vat_rate, lead(id, name), service(name)",
      )
      .eq("status", "sent")
      .order("sent_on")
      .limit(TODAY_ROWS),
  ]);
  const error = leads.error ?? proformas.error;
  if (error) throw new Error(`Could not load Hoy: ${error.message}`);

  return {
    due: dueThisWeek(due.clients, today).slice(0, TODAY_ROWS),
    owedCents: receivables.totalCents,
    owed: owedByClient(receivables.rows).slice(0, TODAY_ROWS),
    leads: leads.data!,
    proformas: proformas.data!,
  };
}
