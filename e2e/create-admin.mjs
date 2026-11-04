// Creates (or resets) the end-to-end tests' admin in the local Supabase and
// writes its credentials to .env.e2e.local, which git ignores. The account
// exists only in the local database: against production the panel's login
// fails before any test can write.
//
//   pnpm e2e:admin

import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { localSupabase } from "../scripts/local-supabase.mjs";

const E2E_ADMIN_EMAIL = "e2e-admin@siete8.test";

const { url, secretKey } = localSupabase();
const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const password = randomBytes(18).toString("base64url");

const { data: list, error: listError } = await supabase.auth.admin.listUsers({
  perPage: 1000,
});
if (listError) throw listError;
const existing = list.users.find((user) => user.email === E2E_ADMIN_EMAIL);

const { data, error } = existing
  ? await supabase.auth.admin.updateUserById(existing.id, { password })
  : await supabase.auth.admin.createUser({
      email: E2E_ADMIN_EMAIL,
      password,
      email_confirm: true,
    });
if (error) throw error;

// The sign-up trigger creates the profile; the panel needs the admin role.
const { error: roleError } = await supabase
  .from("profile")
  .upsert({ id: data.user.id, name: "Admin de pruebas", role: "admin" });
if (roleError) throw roleError;

writeFileSync(
  ".env.e2e.local",
  `E2E_ADMIN_EMAIL=${E2E_ADMIN_EMAIL}\nE2E_ADMIN_PASSWORD=${password}\n`,
);
console.log(`${E2E_ADMIN_EMAIL} is ready; credentials in .env.e2e.local.`);
