import { z } from "zod";

import { clientSchema, parseEnv, serverSchema } from "../../src/env/schema";
import { announcePending } from "../../src/lib/announce";

/**
 * Every 15 minutes: announces on the social networks, through the Make
 * webhook, each published article whose date has passed and that was never
 * announced (docs/MAKE.md). Scheduled functions only run on the production
 * deploy, so previews never post. Logs: Netlify > Logs > Functions.
 */
export default async function announcePosts() {
  // Netlify functions run outside Next, so they read process.env here.
  const webhook = z.url().safeParse(process.env.MAKE_WEBHOOK_URL);
  if (!webhook.success) {
    console.log("Announce: MAKE_WEBHOOK_URL is not set, nothing sent.");
    return;
  }
  const server = parseEnv(serverSchema.pick({ SUPABASE_SECRET_KEY: true }), {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
  const client = parseEnv(
    clientSchema.pick({ NEXT_PUBLIC_SUPABASE_URL: true }),
    { NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL },
  );
  // URL is the production address on Netlify (https://siete8.com).
  const siteUrl = z
    .url()
    .parse(process.env.NEXT_PUBLIC_SITE_URL || process.env.URL);

  const { sent, failed } = await announcePending({
    supabaseUrl: client.NEXT_PUBLIC_SUPABASE_URL,
    secretKey: server.SUPABASE_SECRET_KEY,
    webhookUrl: webhook.data,
    siteUrl,
  });
  console.log(
    `Announce: sent ${sent.length ? sent.join(", ") : "none"}` +
      (failed.length
        ? `; Make failed for ${failed.join(", ")} (retry next run)`
        : ""),
  );
}

export const config = { schedule: "*/15 * * * *" };
