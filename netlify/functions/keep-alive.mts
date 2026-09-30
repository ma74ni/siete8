import { clientSchema, parseEnv } from "../../src/env/schema";

/**
 * Daily keep-alive (E7-04, RNF-29): Supabase pauses free projects after a
 * week without activity, and a paused database breaks every build. One
 * public read a day counts as activity; the log line shows up in Netlify
 * (Logs > Functions > keep-alive).
 */
export default async function keepAlive() {
  const env = parseEnv(
    clientSchema.pick({
      NEXT_PUBLIC_SUPABASE_URL: true,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: true,
    }),
    {
      // Netlify functions run outside Next, so they read process.env here.
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
  );

  const url = new URL(
    "/rest/v1/category?select=slug&limit=1",
    env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const response = await fetch(url, {
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
  });
  if (!response.ok) {
    throw new Error(`Keep-alive failed: HTTP ${response.status}`);
  }
  console.log(`Keep-alive ok: HTTP ${response.status}`);
}

export const config = { schedule: "@daily" };
