import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Error monitoring (E7-06, RNF-27). Shared by the browser and server setups:
 * errors only (no tracing, no session replay), and nothing personal leaves
 * the site. Texts typed by visitors (chat messages, contact form) travel in
 * request bodies and query strings, so those are dropped before sending.
 */

/** Kept from the request headers: they help debugging and name no one. */
const SAFE_HEADERS = new Set(["user-agent", "referer", "accept-language"]);

/** Removes what could identify a visitor or quote what they typed. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.url) event.request.url = event.request.url.split("?")[0];
    if (event.request.headers) {
      event.request.headers = Object.fromEntries(
        Object.entries(event.request.headers).filter(([name]) =>
          SAFE_HEADERS.has(name.toLowerCase()),
        ),
      );
    }
  }
  // Breadcrumbs of requests carry their URLs, which may hold a query string.
  event.breadcrumbs = event.breadcrumbs?.map((crumb) =>
    typeof crumb.data?.url === "string"
      ? { ...crumb, data: { ...crumb.data, url: crumb.data.url.split("?")[0] } }
      : crumb,
  );
  return event;
}

/** Options common to every runtime. Without a DSN nothing is sent. */
export function sentryOptions(dsn: string | undefined, environment?: string) {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: environment ?? "development",
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
  };
}
