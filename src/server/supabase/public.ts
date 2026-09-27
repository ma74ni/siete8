import "server-only";

import { createClient } from "@supabase/supabase-js";

import { clientEnv } from "@/env/client";
import type { Database } from "@/lib/database.types";

/**
 * Anonymous client for public pages. It uses the publishable key and no
 * session, so Row Level Security limits it to published, visible rows, and
 * pages that use it can still be rendered statically.
 */
export function createPublicClient() {
  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
