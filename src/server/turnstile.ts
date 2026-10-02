import "server-only";

import { headers } from "next/headers";

/** The visitor's IP as Netlify reports it; undefined locally. */
export async function clientIp() {
  const list = await headers();
  return (
    list.get("x-nf-client-connection-ip") ??
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  );
}

/** Checks a Cloudflare Turnstile token (RNF-16). */
export async function passesTurnstile(token: string, secret: string) {
  const body = new URLSearchParams({ secret, response: token });
  const ip = await clientIp();
  if (ip) body.set("remoteip", ip);
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  ).catch(() => null);
  if (!response?.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
