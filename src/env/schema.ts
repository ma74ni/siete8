import { z } from "zod";

/**
 * Environment variable schemas. Each task that integrates a service adds its
 * variables here and to `.env.example` (E1-06 Supabase, E3-08 Resend and
 * Turnstile, E7-06 Sentry).
 *
 * This file has no runtime dependencies on Next.js so it can be imported from
 * `next.config.ts` and from tests.
 */

export const serverSchema = z.object({
  // Bypasses Row Level Security. Only used from `src/server/`.
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_"),
});

export const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  // The prefix check stops a secret key from ending up in the browser bundle.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("sb_publishable_"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

export function parseEnv<T extends z.ZodType>(
  schema: T,
  values: Record<string, string | undefined>,
): z.infer<T> {
  // Empty strings count as missing, so `KEY=` in .env files fails validation.
  const cleaned = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ]),
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}
