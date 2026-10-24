import { describe, expect, it } from "vitest";

import {
  formatCents,
  formatPriceWithVat,
  priceWithVatCents,
  toCents,
  withoutVatCents,
} from "./price";

describe("formatPriceWithVat", () => {
  // Seeded signature plans (supabase/seed.sql) against docs/COPY.md §4.
  it.each([
    [6.99, "$8,04"],
    [9.99, "$11,49"],
    [17.99, "$20,69"],
    [26.99, "$31,04"],
    [36.99, "$42,54"],
    [47.99, "$55,19"],
    [54.99, "$63,24"],
    [20.99, "$24,14"],
    [29.99, "$34,49"],
    [39.99, "$45,99"],
    [50.99, "$58,64"],
    [57.99, "$66,69"],
  ])("%s plus 15 %% VAT is %s", (price, expected) => {
    expect(formatPriceWithVat(price, 0.15)).toBe(expected);
  });
});

describe("priceWithVatCents", () => {
  it("rounds half up to the cent", () => {
    // 0.10 × 1.15 = 0.115 → 0.12; floating point gives 0.11499999...
    expect(priceWithVatCents(0.1, 0.15)).toBe(12);
    expect(priceWithVatCents(1.01, 0.15)).toBe(116);
  });

  it("handles a zero rate and a zero price", () => {
    expect(priceWithVatCents(20, 0)).toBe(2000);
    expect(priceWithVatCents(0, 0.15)).toBe(0);
  });

  it.each([
    [-1, 0.15],
    [Number.NaN, 0.15],
    [10, -0.1],
    [10, 15],
  ])("rejects price %s with rate %s", (price, rate) => {
    expect(() => priceWithVatCents(price, rate)).toThrow(RangeError);
  });
});

describe("formatCents", () => {
  it.each([
    [0, "$0,00"],
    [5, "$0,05"],
    [2069, "$20,69"],
    [123450, "$1.234,50"],
    [123456780, "$1.234.567,80"],
  ])("formats %s as %s", (cents, expected) => {
    expect(formatCents(cents)).toBe(expected);
  });
});

describe("toCents", () => {
  it("turns dollars into whole cents without floating point errors", () => {
    expect(toCents(17.99)).toBe(1799);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});

describe("withoutVatCents", () => {
  it("takes the VAT out of an amount with VAT, the inverse of the site's total", () => {
    expect(withoutVatCents(2069, 0.15)).toBe(1799);
    expect(withoutVatCents(priceWithVatCents(100, 0.15), 0.15)).toBe(10000);
  });

  it("rounds half up and leaves amounts at 0 % as they are", () => {
    expect(withoutVatCents(1000, 0.15)).toBe(870);
    expect(withoutVatCents(1234, 0)).toBe(1234);
  });

  it("rejects an invalid rate", () => {
    expect(() => withoutVatCents(100, 1)).toThrow(RangeError);
  });
});
