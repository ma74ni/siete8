import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubEvent, sentryOptions } from "@/lib/sentry";

describe("scrubEvent (E7-06)", () => {
  it("drops what the visitor typed and who they are", () => {
    const event = scrubEvent({
      type: undefined,
      user: { ip_address: "190.1.2.3", email: "ana@correo.com" },
      request: {
        url: "https://siete8.com/contacto?nombre=Ana",
        query_string: "nombre=Ana",
        data: '{"message":"Mi cédula es 1712345678"}',
        cookies: { session: "x" },
        headers: {
          "User-Agent": "Firefox",
          Cookie: "session=x",
          "x-nf-client-connection-ip": "190.1.2.3",
        },
      },
      breadcrumbs: [
        { category: "fetch", data: { url: "/api/chat?x=1", method: "POST" } },
        { category: "console", message: "hola" },
      ],
    } as ErrorEvent);

    expect(event.user).toBeUndefined();
    expect(event.request).toEqual({
      url: "https://siete8.com/contacto",
      headers: { "User-Agent": "Firefox" },
    });
    expect(event.breadcrumbs?.[0]?.data).toEqual({
      url: "/api/chat",
      method: "POST",
    });
    expect(event.breadcrumbs?.[1]?.message).toBe("hola");
  });
});

describe("sentryOptions", () => {
  it("sends nothing without a DSN", () => {
    expect(sentryOptions(undefined).enabled).toBe(false);
    expect(
      sentryOptions("https://key@o1.ingest.sentry.io/2", "production"),
    ).toMatchObject({
      enabled: true,
      environment: "production",
      sendDefaultPii: false,
      tracesSampleRate: 0,
    });
  });
});
