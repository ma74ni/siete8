"use server";

import { clientEnv } from "@/env/client";
import { type FormState, IDLE } from "@/lib/admin-forms";
import { isProductionDeploy } from "@/lib/deploy";

/**
 * Does nothing: the form page sample needs an action to submit to. Server
 * actions stay reachable even where /dev/ui answers 404, so in production it
 * refuses to run at all.
 */
export async function sampleAction(): Promise<FormState> {
  if (isProductionDeploy(clientEnv.NEXT_PUBLIC_SENTRY_ENVIRONMENT)) {
    throw new Error("Not available in production.");
  }
  return IDLE;
}
