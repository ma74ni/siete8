import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { clientEnv } from "@/env/client";
import type { Database } from "@/lib/database.types";

/**
 * Client for the signed-in user, backed by the auth cookies. Row Level
 * Security applies as that user. Used in the panel's Server Components and
 * Server Actions; the proxy refreshes the session before they run.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. The proxy already
            // refreshed the session, so this is safe to ignore there.
          }
        },
      },
    },
  );
}
