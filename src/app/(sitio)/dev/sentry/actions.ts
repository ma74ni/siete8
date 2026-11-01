"use server";

import { clientEnv } from "@/env/client";
import { isProductionDeploy } from "@/lib/deploy";

/** Fails on purpose so the error reaches Sentry (E7-06). */
export async function throwOnServer(): Promise<void> {
  if (isProductionDeploy(clientEnv.NEXT_PUBLIC_SENTRY_ENVIRONMENT)) return;
  throw new Error("Sentry test: server error");
}
