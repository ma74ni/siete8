import { describe, expect, it } from "vitest";

import { ageLabel, daysBetween, periodBalance } from "@/lib/payments";

const period = {
  price_without_vat: 17.99,
  vat_rate: 0.15,
  written_off_on: null,
};

describe("periodBalance", () => {
  it("is pending without payments, with the total from the shared VAT function", () => {
    expect(periodBalance({ ...period, payments: [] })).toEqual({
      totalCents: 2069,
      paidCents: 0,
      balanceCents: 2069,
      status: "pending",
      label: "Pendiente",
    });
  });

  it("is partial with a payment below the total", () => {
    expect(
      periodBalance({ ...period, payments: [{ amount: 10 }] }),
    ).toMatchObject({
      status: "partial",
      balanceCents: 1069,
      label: "Debe $10,69",
    });
  });

  it("is paid when the payments add up, without floating point errors", () => {
    expect(
      periodBalance({
        ...period,
        payments: [{ amount: 10.1 }, { amount: 10.59 }],
      }),
    ).toMatchObject({ status: "paid", balanceCents: 0, label: "Pagado" });
  });

  it("owes nothing once marked as not paying", () => {
    expect(
      periodBalance({
        ...period,
        written_off_on: "2026-10-12",
        payments: [{ amount: 5 }],
      }),
    ).toMatchObject({ status: "written_off", paidCents: 500, balanceCents: 0 });
  });

  it("stays paid if it was paid in full before being written off", () => {
    expect(
      periodBalance({
        ...period,
        written_off_on: "2026-10-12",
        payments: [{ amount: 20.69 }],
      }).status,
    ).toBe("paid");
  });
});

describe("age", () => {
  it("counts whole days and labels them", () => {
    expect(daysBetween("2026-09-30", "2026-10-12")).toBe(12);
    expect(ageLabel(0)).toBe("Hoy");
    expect(ageLabel(1)).toBe("Hace 1 día");
    expect(ageLabel(12)).toBe("Hace 12 días");
  });
});
