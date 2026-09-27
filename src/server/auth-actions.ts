"use server";

import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import { ADMIN_HOME, ADMIN_LOGIN, safeAdminPath } from "@/lib/admin-access";
import { createSessionClient } from "@/server/supabase/session";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

/**
 * Signs in with email and password. The form works without JavaScript: errors
 * come back as a query parameter of the login page.
 */
export async function signIn(formData: FormData): Promise<never> {
  const next = safeAdminPath(formData.get("next"));
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (parsed.success) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    // The proxy decides where to go next, including the 403 for users
    // without the admin role.
    if (!error) redirect(next);
  }

  const params = new URLSearchParams({ error: "credenciales" });
  if (next !== ADMIN_HOME) params.set("next", next);
  redirect(`${ADMIN_LOGIN}?${params}`);
}

export async function signOut(): Promise<never> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect(ADMIN_LOGIN);
}
