/**
 * The weekly email of what is due (E11-04, RF-CRM-17). Runs in
 * netlify/functions/weekly-digest.mts, outside Next, so it only uses relative
 * imports and gets `fetch` injected (tests pass a fake one).
 */

import { todayInQuito } from "./clients";
import {
  CLIENT_SERVICES_SELECT,
  type ClientServiceRow,
  dueReport,
  PURCHASES_SELECT,
  type PurchaseRow,
  weeklyDigest,
} from "./renewals";

type Env = {
  supabaseUrl: string;
  secretKey: string;
  resendApiKey: string;
  to: string;
  siteUrl: string;
};

/**
 * Reads the clients and purchases with the secret key (a system task: there
 * is no admin session), builds the report and emails it with Resend. Nothing
 * is sent when nothing is due and there are no alerts.
 */
export async function sendWeeklyDigest(
  env: Env,
  fetchImpl: typeof fetch = fetch,
  now = new Date(),
): Promise<{ sent: boolean; items: number }> {
  const headers = {
    apikey: env.secretKey,
    Authorization: `Bearer ${env.secretKey}`,
  };
  const read = async <T>(table: string, select: string): Promise<T[]> => {
    const query = new URL(`/rest/v1/${table}`, env.supabaseUrl);
    // supabase-js strips the spaces too; PostgREST does not take them.
    query.searchParams.set("select", select.replace(/\s/g, ""));
    const response = await fetchImpl(query, { headers });
    if (!response.ok) {
      throw new Error(`Could not read ${table}: HTTP ${response.status}`);
    }
    return (await response.json()) as T[];
  };

  const [services, purchases] = await Promise.all([
    read<ClientServiceRow>("client_service", CLIENT_SERVICES_SELECT),
    read<PurchaseRow>("purchase", PURCHASES_SELECT),
  ]);
  const report = dueReport(services, purchases, todayInQuito(now));
  const items =
    report.alerts.length + report.clients.length + report.purchases.length;
  const digest = weeklyDigest(report, env.siteUrl);
  if (!digest) return { sent: false, items };

  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Siete8 <avisos@siete8.com>",
      to: [env.to],
      subject: digest.subject,
      text: digest.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Could not send the weekly email: HTTP ${response.status}`);
  }
  return { sent: true, items };
}
