import * as Sentry from "@sentry/nextjs";

import { clientEnv } from "@/env/client";
import { sentryOptions } from "@/lib/sentry";

// Error monitoring on the server (E7-06): pages, Server Actions and `api/`
// routes. The DSN is only set in Netlify's production context, so local
// runs and previews send nothing.

export async function register() {
  Sentry.init(
    // Not `CONTEXT`: it only exists while building (see `@/lib/deploy`).
    sentryOptions(
      clientEnv.NEXT_PUBLIC_SENTRY_DSN,
      clientEnv.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    ),
  );
}

export const onRequestError = Sentry.captureRequestError;
