"use server";

import { serverEnv } from "@/env/server";

/** Fails on purpose so the error reaches Sentry (E7-06). */
export async function throwOnServer(): Promise<void> {
  if (serverEnv.CONTEXT === "production") return;
  throw new Error("Sentry test: server error");
}
