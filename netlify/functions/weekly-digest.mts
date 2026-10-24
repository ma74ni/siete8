import { z } from "zod";

import { clientSchema, parseEnv, serverSchema } from "../../src/env/schema";
import { sendWeeklyDigest } from "../../src/lib/weekly-digest";

/**
 * Mondays at 08:00 in Quito (13:00 UTC): emails the admin what expires in the
 * next 30 days, to collect and to pay, and the cross alerts (E11-04,
 * RF-CRM-17). Nothing is sent when nothing is due. Scheduled functions only
 * run on the production deploy. Logs: Netlify > Logs > Functions.
 */
export default async function weeklyDigest() {
  // Netlify functions run outside Next, so they read process.env here.
  const server = parseEnv(
    serverSchema.pick({
      SUPABASE_SECRET_KEY: true,
      RESEND_API_KEY: true,
      ADMIN_NOTIFICATION_EMAIL: true,
    }),
    {
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
    },
  );
  if (!server.RESEND_API_KEY || !server.ADMIN_NOTIFICATION_EMAIL) {
    console.log(
      "Weekly digest: RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL is not set, nothing sent.",
    );
    return;
  }
  const client = parseEnv(
    clientSchema.pick({ NEXT_PUBLIC_SUPABASE_URL: true }),
    { NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL },
  );
  // URL is the production address on Netlify (https://siete8.com).
  const siteUrl = z
    .url()
    .parse(process.env.NEXT_PUBLIC_SITE_URL || process.env.URL);

  const { sent, items } = await sendWeeklyDigest({
    supabaseUrl: client.NEXT_PUBLIC_SUPABASE_URL,
    secretKey: server.SUPABASE_SECRET_KEY,
    resendApiKey: server.RESEND_API_KEY,
    to: server.ADMIN_NOTIFICATION_EMAIL,
    siteUrl,
  });
  console.log(
    sent
      ? `Weekly digest: sent with ${items} items.`
      : "Weekly digest: nothing due, not sent.",
  );
}

export const config = { schedule: "0 13 * * 1" };
