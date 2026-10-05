import * as Sentry from "@sentry/nextjs";

import { clientEnv } from "@/env/client";
import { sentryOptions } from "@/lib/sentry";

// Error monitoring in the browser (E7-06). Reports go through the
// `/monitoring` tunnel on this site, so the CSP stays unchanged.

Sentry.init(
  sentryOptions(
    clientEnv.NEXT_PUBLIC_SENTRY_DSN,
    clientEnv.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  ),
);
