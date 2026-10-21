import { describe, expect, it } from "vitest";

import {
  cycleText,
  licensesCostCents,
  licenseUse,
  licenseUseLabel,
  paymentTotalCents,
  renewalModeLabel,
  serviceLicensesCostCents,
  unitCostCents,
} from "@/lib/purchases";

describe("payments to providers", () => {
  it("adds the platform amount and the taxes paid here, in cents", () => {
    expect(
      paymentTotalCents({ amount: 0.1, vat_amount: 0.2, isd_amount: 0.0 }),
    ).toBe(30);
    expect(
      paymentTotalCents({ amount: 120, vat_amount: 18, isd_amount: 6 }),
    ).toBe(14_400);
  });

  it("divides the total by the quantity paid, rounded to the cent", () => {
    expect(
      unitCostCents({ amount: 60, vat_amount: 9, isd_amount: 3, quantity: 10 }),
    ).toBe(720);
    expect(
      unitCostCents({ amount: 10, vat_amount: 0, isd_amount: 0, quantity: 3 }),
    ).toBe(333);
  });
});

describe("labels", () => {
  it("names the renewal mode", () => {
    expect(
      renewalModeLabel({ renews_every_unit: "year", auto_renew: true }),
    ).toBe("Automática");
    expect(
      renewalModeLabel({ renews_every_unit: "month", auto_renew: false }),
    ).toBe("Manual");
    expect(
      renewalModeLabel({ renews_every_unit: null, auto_renew: true }),
    ).toBe("Pago único");
    expect(cycleText(1, "year")).toBe("1 año");
    expect(cycleText(null, null)).toBeNull();
  });

  it("counts licenses without going below zero", () => {
    expect(licenseUseLabel(licenseUse(10, 8))).toBe(
      "8 de 10 asignadas, 2 sin uso.",
    );
    expect(licenseUse(2, 3).unused).toBe(0);
  });
});

describe("license cost of a client period", () => {
  const monthly = { value: 1, unit: "month" as const };
  const yearly = { value: 1, unit: "year" as const };
  const oneOff = { value: null, unit: null };

  it("scales the unit cost from the purchase's cycle to the service's", () => {
    expect(licensesCostCents(600, 2, monthly, yearly)).toBe(14_400);
    expect(licensesCostCents(7_200, 1, yearly, monthly)).toBe(600);
    expect(
      licensesCostCents(1_000, 1, yearly, { value: 2, unit: "year" }),
    ).toBe(2_000);
    expect(
      licensesCostCents(1_000, 1, yearly, { value: 7, unit: "month" }),
    ).toBe(583);
    expect(
      licensesCostCents(
        700,
        1,
        { value: 7, unit: "day" },
        { value: 30, unit: "day" },
      ),
    ).toBe(3_000);
  });

  it("counts a one-off purchase once", () => {
    expect(licensesCostCents(1_500, 3, oneOff, yearly)).toBe(4_500);
    expect(licensesCostCents(1_500, 1, oneOff, oneOff)).toBe(1_500);
  });

  it("gives up when the cycles can't be compared", () => {
    expect(licensesCostCents(600, 1, monthly, oneOff)).toBeNull();
    expect(
      licensesCostCents(600, 1, monthly, { value: 30, unit: "day" }),
    ).toBeNull();
  });
});

describe("license cost of a client service", () => {
  const monthly = { value: 1, unit: "month" as const };
  const yearly = { value: 1, unit: "year" as const };

  it("adds the licenses of every purchase", () => {
    expect(
      serviceLicensesCostCents(
        [
          { unitCostCents: 600, count: 2, purchaseCycle: monthly },
          { unitCostCents: 1_000, count: 1, purchaseCycle: yearly },
        ],
        yearly,
      ),
    ).toBe(15_400);
  });

  it("prefills nothing without licenses or with one it can't price", () => {
    expect(serviceLicensesCostCents([], yearly)).toBeNull();
    expect(
      serviceLicensesCostCents(
        [
          { unitCostCents: 600, count: 2, purchaseCycle: monthly },
          { unitCostCents: null, count: 1, purchaseCycle: yearly },
        ],
        yearly,
      ),
    ).toBeNull();
  });
});
