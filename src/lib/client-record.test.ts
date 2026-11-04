import { describe, expect, it } from "vitest";

import {
  clientSummary,
  latestPayments,
  owedCents,
  paymentNeedsAttention,
  periodName,
  periodToPay,
  serviceTitle,
} from "@/lib/client-record";
import type { PeriodBalance } from "@/lib/payments";

const balance = (balanceCents: number): PeriodBalance => ({
  totalCents: 11385,
  paidCents: 11385 - balanceCents,
  balanceCents,
  status: balanceCents > 0 ? "partial" : "paid",
  label: "",
});

const period = (
  id: string,
  endsOn: string | null,
  owed = 0,
  payments: { id: string; paid_on: string; created_at?: string }[] = [],
) => ({
  id,
  ends_on: endsOn,
  balance: balance(owed),
  client_payment: payments.map((payment) => ({
    amount: 10,
    method: "transfer" as const,
    created_at: "2026-01-01T00:00:00Z",
    ...payment,
  })),
});

const service = (
  name: string,
  periods: ReturnType<typeof period>[],
  status: "active" | "cancelled" = "active",
  detail: string | null = null,
) => ({
  status,
  service: { name },
  plan: null,
  detail,
  client_service_period: periods,
});

const today = "2026-11-01";

describe("client summary", () => {
  it("adds what every service owes, cancelled ones too", () => {
    const summary = clientSummary(
      [
        service("Hosting", [
          period("h2", "2027-01-01", 500),
          period("h1", null, 200),
        ]),
        service("Dominio", [period("d1", "2026-05-01", 300)], "cancelled"),
      ],
      today,
    );
    expect(summary.owedCents).toBe(1000);
    expect(summary.activeServices).toBe(1);
  });

  it("takes the soonest expiry ahead among active services", () => {
    const summary = clientSummary(
      [
        service("Hosting", [period("h", "2026-12-20")]),
        service(
          "Dominio",
          [period("d", "2026-11-15")],
          "active",
          "heladeria.com",
        ),
        service("Firma", [period("f", "2026-11-05")], "cancelled"),
        service("Web", [period("w", null)]),
      ],
      today,
    );
    expect(summary.nextExpiry).toEqual({
      service: "Dominio, heladeria.com",
      day: "2026-11-15",
      expired: false,
    });
  });

  it("puts first what expired longest ago, today included", () => {
    expect(
      clientSummary(
        [
          service("Hosting", [period("h", "2026-11-15")]),
          service("Correo", [period("c", today)]),
          service("Dominio", [period("d", "2026-10-01")]),
        ],
        today,
      ).nextExpiry,
    ).toEqual({ service: "Dominio", day: "2026-10-01", expired: true });
    expect(
      clientSummary([service("Hosting", [period("h", today)])], today)
        .nextExpiry,
    ).toEqual({ service: "Hosting", day: today, expired: true });
  });

  it("has nothing for a client without services", () => {
    expect(clientSummary([], today)).toEqual({
      owedCents: 0,
      nextExpiry: null,
      activeServices: 0,
    });
  });
});

describe("latest payments", () => {
  it("lists the most recent first, across services, up to the limit", () => {
    const payments = latestPayments(
      [
        service("Hosting", [
          period("h", null, 0, [
            { id: "a", paid_on: "2026-03-01" },
            { id: "b", paid_on: "2026-10-01" },
          ]),
        ]),
        service("Dominio", [
          period("d", null, 0, [
            {
              id: "c",
              paid_on: "2026-10-01",
              created_at: "2026-10-01T10:00:00Z",
            },
            { id: "d", paid_on: "2026-06-01" },
          ]),
        ]),
      ],
      3,
    );
    expect(payments.map((payment) => [payment.id, payment.service])).toEqual([
      ["c", "Dominio"],
      ["b", "Hosting"],
      ["d", "Dominio"],
    ]);
  });

  it("is empty without payments", () => {
    expect(latestPayments([service("Hosting", [period("h", null)])])).toEqual(
      [],
    );
  });
});

describe("period to pay", () => {
  it("is the oldest period that still owes", () => {
    const periods = [
      period("2027", "2027-01-01", 11385),
      period("2026", "2026-01-01", 500),
      period("2025", "2025-01-01"),
    ];
    expect(periodToPay(periods)?.id).toBe("2026");
    expect(owedCents(periods)).toBe(11885);
  });

  it("is null when everything is paid or there are no periods", () => {
    expect(periodToPay([period("2026", null)])).toBeNull();
    expect(periodToPay([])).toBeNull();
  });
});

describe("service title", () => {
  it("joins the name and the detail, leaving out what is missing", () => {
    expect(
      serviceTitle({ service: { name: "Hosting" }, detail: "heladeria.com" }),
    ).toBe("Hosting, heladeria.com");
    expect(serviceTitle({ service: { name: "Hosting" }, detail: null })).toBe(
      "Hosting",
    );
    expect(serviceTitle({ service: null, detail: null })).toBe("");
  });

  it("takes the plan when there is no detail", () => {
    expect(
      serviceTitle({
        service: { name: "Correo corporativo" },
        plan: { name: "Correo Negocio" },
        detail: null,
      }),
    ).toBe("Correo corporativo, Correo Negocio");
    expect(
      serviceTitle({
        service: { name: "Hosting" },
        plan: { name: "Web Básico" },
        detail: "heladeria.com",
      }),
    ).toBe("Hosting, heladeria.com");
  });
});

describe("payment needs attention", () => {
  const owing = (status: PeriodBalance["status"], startsOn: string) => ({
    starts_on: startsOn,
    balance: { ...balance(500), status },
  });

  it("is an alert when part is owed, or all once the period started", () => {
    expect(paymentNeedsAttention(owing("partial", "2027-01-01"), today)).toBe(
      true,
    );
    expect(paymentNeedsAttention(owing("pending", today), today)).toBe(true);
    expect(paymentNeedsAttention(owing("pending", "2027-01-01"), today)).toBe(
      false,
    );
    expect(paymentNeedsAttention(owing("paid", "2026-01-01"), today)).toBe(
      false,
    );
    expect(
      paymentNeedsAttention(owing("written_off", "2026-01-01"), today),
    ).toBe(false);
  });
});

describe("period name", () => {
  it("names a period by its days, or by its start when it does not end", () => {
    expect(periodName({ starts_on: "2026-01-01", ends_on: "2027-01-01" })).toBe(
      "Período del 1 de enero de 2026 al 1 de enero de 2027",
    );
    expect(periodName({ starts_on: "2026-01-01", ends_on: null })).toBe(
      "Período desde el 1 de enero de 2026",
    );
  });
});
