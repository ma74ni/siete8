import { describe, expect, it } from "vitest";

import {
  endsAfter,
  expiry,
  formatSignedCents,
  needsAttention,
  planRenewal,
  profitCents,
  renewalText,
} from "@/lib/clients";

describe("planRenewal", () => {
  it("takes the plan's duration", () => {
    expect(planRenewal({ duration_value: 2, duration_unit: "year" })).toEqual({
      value: "2",
      unit: "year",
    });
  });

  it("is a one-off payment without a plan or without a duration", () => {
    const oneOff = { value: "", unit: "" };
    expect(planRenewal(undefined)).toEqual(oneOff);
    expect(planRenewal({ duration_value: null, duration_unit: null })).toEqual(
      oneOff,
    );
    expect(planRenewal({ duration_value: 1, duration_unit: null })).toEqual(
      oneOff,
    );
  });
});

describe("endsAfter", () => {
  it("is one renewal after the start", () => {
    expect(endsAfter("2026-10-24", { value: "1", unit: "year" })).toBe(
      "2027-10-24",
    );
    expect(endsAfter("2027-01-31", { value: "1", unit: "month" })).toBe(
      "2027-02-28",
    );
  });

  it("is empty for one-off payments, no start, or a value below 1", () => {
    expect(endsAfter("2026-10-24", { value: "", unit: "" })).toBe("");
    expect(endsAfter("", { value: "1", unit: "year" })).toBe("");
    expect(endsAfter("2026-10-24", { value: "0", unit: "month" })).toBe("");
    expect(endsAfter("2026-10-24", { value: "", unit: "month" })).toBe("");
  });
});

describe("expiry", () => {
  it("labels expired, upcoming and open-ended services", () => {
    expect(expiry("2026-10-12", "2026-10-12")).toMatchObject({
      state: "expired",
      label: "Venció el 12 de octubre de 2026",
    });
    expect(expiry("2027-01-05", "2026-10-12")).toMatchObject({
      state: "active",
      label: "Vence el 5 de enero de 2027",
    });
    expect(expiry(null, "2026-10-12")).toEqual({
      state: "none",
      label: "Sin vencimiento",
    });
  });
});

describe("needsAttention", () => {
  const today = "2026-10-12";

  it("alerts an expired date unless it was cancelled", () => {
    expect(needsAttention(expiry("2026-10-12", today), "active")).toBe(true);
    expect(needsAttention(expiry("2026-10-01", today), "cancelled")).toBe(
      false,
    );
  });

  it("does not alert an upcoming or open-ended date", () => {
    expect(needsAttention(expiry("2026-10-13", today), "active")).toBe(false);
    expect(needsAttention(expiry(null, today), "active")).toBe(false);
  });
});

describe("renewalText", () => {
  it("uses singular and plural", () => {
    expect(renewalText(1, "year")).toBe("1 año");
    expect(renewalText(6, "month")).toBe("6 meses");
    expect(renewalText(null, null)).toBe("Pago único");
  });
});

describe("profit", () => {
  it("is computed in cents without floating point errors", () => {
    expect(profitCents(0.3, 0.1)).toBe(20);
    expect(profitCents(15, 10.01)).toBe(499);
  });

  it("shows losses with a minus sign", () => {
    expect(formatSignedCents(-350)).toBe("-$3,50");
    expect(formatSignedCents(123_450)).toBe("$1.234,50");
  });
});
