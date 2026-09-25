import { z } from "zod";

/**
 * Environment variable schemas. Each task that integrates a service adds its
 * variables here and to `.env.example` (E1-01 Supabase, E3-08 Resend and
 * Turnstile, E7-06 Sentry).
 *
 * This file has no runtime dependencies on Next.js so it can be imported from
 * `next.config.ts` and from tests.
 */

export const serverSchema = z.object({});

export const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
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
