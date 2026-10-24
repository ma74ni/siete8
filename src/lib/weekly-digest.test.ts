import { describe, expect, it, vi } from "vitest";

import type { ClientServiceRow, PurchaseRow } from "@/lib/renewals";
import { sendWeeklyDigest } from "@/lib/weekly-digest";

// Made-up client and amounts (SRS 3.9).

const env = {
  supabaseUrl: "https://example.supabase.co",
  secretKey: "sb_secret_test",
  resendApiKey: "re_test",
  to: "admin@siete8.test",
  siteUrl: "https://siete8.com",
};

// Monday 26 October 2026, 08:00 in Quito.
const NOW = new Date("2026-10-26T13:00:00Z");

const dueService: ClientServiceRow = {
  id: "cs1",
  detail: "heladeria.test",
  status: "active",
  cancelled_at: null,
  renews_every_value: 1,
  renews_every_unit: "year",
  service: { name: "Hosting" },
  client: { id: "c1", name: "Heladería Polar" },
  client_service_period: [
    {
      id: "p1",
      sold_on: "2025-11-05",
      starts_on: "2025-11-05",
      ends_on: "2026-11-05",
      price_without_vat: 17.99,
      vat_rate: 0.15,
      cost_without_vat: 8,
      written_off_on: null,
      created_at: "2025-11-05T10:00:00Z",
      client_payment: [],
    },
  ],
};

function fakeFetch(rows: {
  services: ClientServiceRow[];
  purchases: PurchaseRow[];
  supabaseStatus?: number;
  resendStatus?: number;
}) {
  return vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    if (url.hostname === "api.resend.com") {
      return new Response("{}", { status: rows.resendStatus ?? 200 });
    }
    const body = url.pathname.endsWith("/client_service")
      ? rows.services
      : rows.purchases;
    return new Response(JSON.stringify(body), {
      status: rows.supabaseStatus ?? 200,
    });
  });
}

describe("sendWeeklyDigest", () => {
  it("does not email when nothing is due", async () => {
    const fetchImpl = fakeFetch({ services: [], purchases: [] });
    await expect(sendWeeklyDigest(env, fetchImpl, NOW)).resolves.toEqual({
      sent: false,
      items: 0,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reads with the secret key and a select without spaces, then emails the admin", async () => {
    const fetchImpl = fakeFetch({ services: [dueService], purchases: [] });
    await expect(sendWeeklyDigest(env, fetchImpl, NOW)).resolves.toEqual({
      sent: true,
      items: 1,
    });

    const [read, init] = fetchImpl.mock.calls[0]!;
    const select = new URL(String(read)).searchParams.get("select");
    expect(select).not.toMatch(/\s/);
    expect(select).toContain("client_service_period(");
    expect((init as RequestInit).headers).toMatchObject({
      apikey: "sb_secret_test",
      Authorization: "Bearer sb_secret_test",
    });

    const [, email] = fetchImpl.mock.calls[2]!;
    const sent = JSON.parse(String((email as RequestInit).body));
    expect(sent).toMatchObject({
      from: "Siete8 <avisos@siete8.com>",
      to: ["admin@siete8.test"],
      subject: "Siete8: 1 vencimiento en los próximos 30 días",
    });
    expect(sent.text).toContain(
      "- Heladería Polar: Hosting, heladeria.test. Vence el 5 de noviembre de 2026. Pendiente.",
    );
  });

  it("fails loudly when Supabase or Resend fail, so the log shows it", async () => {
    await expect(
      sendWeeklyDigest(
        env,
        fakeFetch({ services: [], purchases: [], supabaseStatus: 401 }),
        NOW,
      ),
    ).rejects.toThrow("HTTP 401");
    await expect(
      sendWeeklyDigest(
        env,
        fakeFetch({
          services: [dueService],
          purchases: [],
          resendStatus: 422,
        }),
        NOW,
      ),
    ).rejects.toThrow("Could not send the weekly email: HTTP 422");
  });
});
