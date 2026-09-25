import { clientSchema, parseEnv } from "./schema";

/**
 * Public variables, safe for the browser. Each one must be read by its full
 * name so Next.js can inline it at build time.
 */
export const clientEnv = parseEnv(clientSchema, {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
