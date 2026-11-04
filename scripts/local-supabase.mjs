// The local Supabase (Docker) the end-to-end tests and the volume seed use.
// Its address and keys come from `supabase status`; anything that is not on
// this machine is refused, because `.env.local` points to production.

import { execFileSync } from "node:child_process";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

/** Whether a URL is on this machine. */
export function isLocalUrl(url) {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** API URL and keys of the local Supabase; fails if it is not local. */
export function localSupabase() {
  let output;
  try {
    output = execFileSync("pnpm", ["exec", "supabase", "status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(
      "Local Supabase is not running: start it with pnpm db:start.",
    );
  }
  const values = Object.fromEntries(
    output
      .split("\n")
      .map((line) => /^([A-Z_]+)="?(.*?)"?$/.exec(line.trim()))
      .filter(Boolean)
      .map(([, key, value]) => [key, value]),
  );
  const url = values.API_URL;
  const secretKey = values.SECRET_KEY;
  const publishableKey = values.PUBLISHABLE_KEY;
  if (!url || !secretKey || !publishableKey)
    throw new Error("supabase status gave no API URL or key.");
  if (!isLocalUrl(url)) {
    throw new Error(
      `Refusing to use ${url}: only the local Supabase is allowed.`,
    );
  }
  return { url, secretKey, publishableKey };
}
