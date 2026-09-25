import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { ADMIN_FORBIDDEN, ADMIN_LOGIN } from "@/lib/admin-access";
import { createSessionClient } from "@/server/supabase/session";

export type Admin = { id: string; email: string | null };

type Session =
  | { status: "signed-out" }
  | { status: "no-role" }
  | { status: "admin"; admin: Admin };

/**
 * Verifies the session token and checks the role in the database. Memoized
 * for one render.
 */
const getSession = cache(async (): Promise<Session> => {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return { status: "signed-out" };

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return { status: "no-role" };

  const { sub, email } = data.claims;
  return {
    status: "admin",
    admin: { id: sub, email: typeof email === "string" ? email : null },
  };
});

/**
 * Second line of defense after the proxy: the panel layout and every panel
 * Server Action call this before reading or writing data.
 */
export async function requireAdmin(): Promise<Admin> {
  const session = await getSession();
  if (session.status === "admin") return session.admin;
  redirect(session.status === "signed-out" ? ADMIN_LOGIN : ADMIN_FORBIDDEN);
}
