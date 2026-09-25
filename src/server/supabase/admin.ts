import "server-only";

import { createClient } from "@supabase/supabase-js";

import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import type { Database } from "@/lib/database.types";

/**
 * Client with the secret key. It bypasses Row Level Security, so it is only
 * used after the caller has validated the input with Zod and checked
 * permissions (for example, inserting a lead after Turnstile and consent).
 */
export function createAdminClient() {
  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
