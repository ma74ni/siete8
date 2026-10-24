import { describe, expect, it } from "vitest";

import {
  lossCents,
  monthlyCsvRows,
  monthlyProfits,
  paymentWithoutVatCents,
  profitFilters,
  profitYears,
  type ProfitData,
  type ProfitPeriod,
  type ProfitPurchase,
  profitsByClient,
  profitsByService,
  spreadByMonth,
  unassignedShareCents,
  unusedLicenses,
} from "@/lib/profits";

// Made-up clients, providers and amounts (SRS 3.9: never the real issuer).

function period(overrides: Partial<ProfitPeriod> = {}): ProfitPeriod {
  return {
    id: "p1",
    clientId: "c1",
    client: "Heladería Polar",
    serviceId: "s-firma",
    service: "Firma electrónica",
    soldOn: "2026-03-10",
    priceWithoutVat: 17.99,
    vatRate: 0.15,
    cost: 8,
    writtenOffOn: null,
    purchaseBacked: false,
    payments: [{ paidOn: "2026-03-12", amount: 20.69 }],
    ...overrides,
  };
}

function purchase(overrides: Partial<ProfitPurchase> = {}): ProfitPurchase {
  return {
    id: "pu1",
    concept: "Hosting compartido",
    provider: "Proveedor Uno",
    clientServiceId: null,
    services: [{ id: "s-hosting", name: "Hosting" }],
    assignedLicenses: 0,
    clientLicenses: 0,
    payments: [
      {
        // A yearly plan paid in January: $1.200 with taxes.
        paidOn: "2026-01-05",
        coversFrom: "2026-01-01",
        coversTo: "2027-01-01",
        quantity: 1,
        amount: 1000,
        vatAmount: 150,
        isdAmount: 50,
      },
    ],
    ...overrides,
  };
}

const data = (overrides: Partial<ProfitData> = {}): ProfitData => ({
  periods: [],
  purchases: [],
  ...overrides,
});

describe("spreadByMonth", () => {
  it("spreads a year over the days of each month and adds up exactly", () => {
    const parts = spreadByMonth(
      120000,
      "2026-01-01",
      "2027-01-01",
      "2026-01-05",
    );
    expect(parts.size).toBe(12);
    expect(parts.get("2026-01")).toBe(Math.round((120000 * 31) / 365));
    expect(parts.get("2026-02")).toBe(
      Math.round((120000 * 59) / 365) - Math.round((120000 * 31) / 365),
    );
    expect([...parts.values()].reduce((a, b) => a + b, 0)).toBe(120000);
  });

  it("stays within half a cent when the stretch touches the start or the end", () => {
    // 36.000 cents over 365 days from 10 January: 356 days fall in 2026.
    const parts = spreadByMonth(
      36000,
      "2026-01-10",
      "2027-01-10",
      "2026-01-10",
    );
    const year2026 = [...parts]
      .filter(([month]) => month.startsWith("2026-"))
      .reduce((sum, [, cents]) => sum + cents, 0);
    expect(Math.abs(year2026 - (36000 * 356) / 365)).toBeLessThanOrEqual(0.5);
  });

  it("stays within one cent for a year in the middle of the coverage", () => {
    const parts = spreadByMonth(1148, "2025-12-20", "2027-01-12", "2025-12-20");
    const year2026 = [...parts]
      .filter(([month]) => month.startsWith("2026-"))
      .reduce((sum, [, cents]) => sum + cents, 0);
    const exact = (1148 * 365) / 388;
    expect(Math.abs(year2026 - exact)).toBeLessThan(1);
  });

  it("splits a period that crosses two months", () => {
    const parts = spreadByMonth(1000, "2026-01-21", "2026-02-11", "2026-01-21");
    // 11 days in January, 10 in February.
    expect(parts.get("2026-01")).toBe(524);
    expect(parts.get("2026-02")).toBe(476);
  });

  it("puts it all in the payment's month without an end", () => {
    expect([...spreadByMonth(500, "2026-03-01", null, "2026-04-02")]).toEqual([
      ["2026-04", 500],
    ]);
  });
});

describe("building blocks", () => {
  it("takes the VAT out of a client payment", () => {
    expect(paymentWithoutVatCents(20.69, 0.15)).toBe(1799);
  });

  it("measures a loss as what was still owed, without VAT", () => {
    expect(
      lossCents(period({ payments: [{ paidOn: "2026-03-12", amount: 10 }] })),
    ).toBe(Math.round(1069 / 1.15));
  });

  it("charges only the licenses no client carries", () => {
    const payment = {
      ...purchase().payments[0]!,
      quantity: 10,
    };
    expect(unassignedShareCents(payment, 0)).toBe(120000);
    expect(unassignedShareCents(payment, 8)).toBe(24000);
    expect(unassignedShareCents(payment, 12)).toBe(0);
  });
});

describe("monthlyProfits: accrual", () => {
  it("counts a sale and its cost in the month it was sold", () => {
    const { months, total } = monthlyProfits(
      data({ periods: [period()] }),
      2026,
      "accrual",
    );
    expect(months[2]).toMatchObject({
      label: "Marzo",
      incomeCents: 1799,
      directCostCents: 800,
      profitCents: 999,
    });
    expect(total.profitCents).toBe(999);
  });

  it("spreads a yearly shared purchase over the twelve months", () => {
    const { months, total } = monthlyProfits(
      data({ purchases: [purchase()] }),
      2026,
      "accrual",
    );
    expect(months.every((month) => month.sharedCents > 0)).toBe(true);
    expect(months[0]!.sharedCents).toBe(Math.round((120000 * 31) / 365));
    expect(total.sharedCents).toBe(120000);
  });

  it("leaves a client's own purchase out: it is in that client's direct cost", () => {
    const { total } = monthlyProfits(
      data({ purchases: [purchase({ clientServiceId: "cs1" })] }),
      2026,
      "accrual",
    );
    expect(total.sharedCents).toBe(0);
  });

  it("shows what a client will not pay as a loss in the month it was marked", () => {
    const { months, total } = monthlyProfits(
      data({
        periods: [period({ payments: [], writtenOffOn: "2026-06-01" })],
      }),
      2026,
      "accrual",
    );
    expect(months[2]!.incomeCents).toBe(1799);
    expect(months[5]!.lossCents).toBe(Math.round(2069 / 1.15));
    expect(total.profitCents).toBe(1799 - 800 - Math.round(2069 / 1.15));
  });

  it("only counts the chosen year", () => {
    const { total } = monthlyProfits(
      data({ periods: [period({ soldOn: "2025-12-31" })] }),
      2026,
      "accrual",
    );
    expect(total.incomeCents).toBe(0);
  });
});

describe("monthlyProfits: cash", () => {
  it("counts income when paid, without VAT", () => {
    const { months } = monthlyProfits(
      data({
        periods: [
          period({
            payments: [
              { paidOn: "2026-03-12", amount: 10 },
              { paidOn: "2026-04-02", amount: 10.69 },
            ],
          }),
        ],
      }),
      2026,
      "cash",
    );
    expect(months[2]!.incomeCents).toBe(paymentWithoutVatCents(10, 0.15));
    expect(months[3]!.incomeCents).toBe(paymentWithoutVatCents(10.69, 0.15));
  });

  it("takes a yearly shared purchase whole, in the month it was paid", () => {
    const { months } = monthlyProfits(
      data({ purchases: [purchase()] }),
      2026,
      "cash",
    );
    expect(months[0]!.sharedCents).toBe(120000);
    expect(months[1]!.sharedCents).toBe(0);
  });

  it("does not count a direct cost twice when a purchase pays for it", () => {
    const own = purchase({
      clientServiceId: "cs1",
      payments: [
        {
          ...purchase().payments[0]!,
          paidOn: "2026-03-01",
          amount: 8,
          vatAmount: 0,
          isdAmount: 0,
        },
      ],
    });
    const { months } = monthlyProfits(
      data({ periods: [period({ purchaseBacked: true })], purchases: [own] }),
      2026,
      "cash",
    );
    expect(months[2]!.directCostCents).toBe(800);
  });

  it("counts the direct cost of a period that no purchase pays for", () => {
    const { months } = monthlyProfits(
      data({ periods: [period()] }),
      2026,
      "cash",
    );
    expect(months[2]!.directCostCents).toBe(800);
  });

  it("has no losses: unpaid money never came in", () => {
    const { total } = monthlyProfits(
      data({ periods: [period({ payments: [], writtenOffOn: "2026-06-01" })] }),
      2026,
      "cash",
    );
    expect(total.lossCents).toBe(0);
    expect(total.incomeCents).toBe(0);
  });
});

describe("profitsByService", () => {
  it("puts shared purchases in their service, their group or General", () => {
    const rows = profitsByService(
      data({
        periods: [period()],
        purchases: [
          purchase({
            id: "one",
            services: [{ id: "s-firma", name: "Firma electrónica" }],
          }),
          purchase({
            id: "group",
            services: [
              { id: "s-hosting", name: "Hosting" },
              { id: "s-correo", name: "Correo" },
            ],
          }),
          purchase({ id: "general", services: [] }),
        ],
      }),
      2026,
    );
    expect(rows.map((row) => row.name)).toEqual([
      "Correo + Hosting",
      "Firma electrónica",
      "General",
    ]);
    expect(rows[1]).toMatchObject({
      incomeCents: 1799,
      directCostCents: 800,
      sharedCents: 120000,
    });
  });
});

describe("profitsByClient", () => {
  it("adds each client's sales minus their direct cost, best first", () => {
    const rows = profitsByClient(
      data({
        periods: [
          period(),
          period({
            id: "p2",
            clientId: "c2",
            client: "Ferretería Andes",
            priceWithoutVat: 100,
            cost: 10,
          }),
        ],
        purchases: [purchase()],
      }),
      2026,
    );
    expect(rows.map((row) => [row.name, row.profitCents])).toEqual([
      ["Ferretería Andes", 9000],
      ["Heladería Polar", 999],
    ]);
    expect(rows.every((row) => row.sharedCents === 0)).toBe(true);
  });
});

describe("unusedLicenses", () => {
  it("shows the cost of the licenses no client uses", () => {
    const licenses = purchase({
      concept: "Microsoft 365",
      assignedLicenses: 8,
      clientLicenses: 8,
      payments: [{ ...purchase().payments[0]!, quantity: 10 }],
    });
    expect(unusedLicenses(data({ purchases: [licenses] }), 2026)).toEqual([
      {
        purchaseId: "pu1",
        concept: "Microsoft 365",
        provider: "Proveedor Uno",
        quantity: 10,
        assigned: 8,
        unused: 2,
        costCents: 24000,
      },
    ]);
  });

  it("prices only the unused licenses, not those used by an email", () => {
    // 10 licenses: 6 for clients, 2 for Siete8's own emails, 2 unused.
    const licenses = purchase({
      assignedLicenses: 8,
      clientLicenses: 6,
      payments: [{ ...purchase().payments[0]!, quantity: 10 }],
    });
    const [row] = unusedLicenses(data({ purchases: [licenses] }), 2026);
    expect(row).toMatchObject({ assigned: 8, unused: 2, costCents: 24000 });
    // In the accrual view, the emails' licenses stay as Siete8's own cost.
    expect(
      monthlyProfits(data({ purchases: [licenses] }), 2026, "accrual").total
        .sharedCents,
    ).toBe(48000);
  });

  it("prices each payment with its own quantity, not the latest one", () => {
    // $100 for 2 licenses in the first half, $500 for 10 in the second; none assigned.
    const grown = purchase({
      payments: [
        {
          ...purchase().payments[0]!,
          coversFrom: "2026-01-01",
          coversTo: "2026-07-01",
          quantity: 2,
          amount: 100,
          vatAmount: 0,
          isdAmount: 0,
        },
        {
          ...purchase().payments[0]!,
          coversFrom: "2026-07-01",
          coversTo: "2027-01-01",
          quantity: 10,
          amount: 500,
          vatAmount: 0,
          isdAmount: 0,
        },
      ],
    });
    const [row] = unusedLicenses(data({ purchases: [grown] }), 2026);
    expect(row).toMatchObject({ quantity: 10, unused: 10, costCents: 60000 });
  });

  it("leaves out purchases that cost nothing in the year", () => {
    const old = purchase({
      assignedLicenses: 1,
      payments: [
        {
          ...purchase().payments[0]!,
          quantity: 5,
          coversFrom: "2024-01-01",
          coversTo: "2025-01-01",
        },
      ],
    });
    expect(unusedLicenses(data({ purchases: [old] }), 2026)).toEqual([]);
  });

  it("leaves out single purchases and fully assigned ones", () => {
    const full = purchase({
      assignedLicenses: 10,
      payments: [{ ...purchase().payments[0]!, quantity: 10 }],
    });
    expect(
      unusedLicenses(data({ purchases: [purchase(), full] }), 2026),
    ).toEqual([]);
  });
});

describe("monthlyCsvRows", () => {
  it("has a row per month and the year's total, with a comma decimal", () => {
    const rows = monthlyCsvRows(
      monthlyProfits(data({ periods: [period()] }), 2026, "accrual"),
      2026,
    );
    expect(rows).toHaveLength(14);
    expect(rows[3]).toEqual(["Marzo", "17,99", "8,00", "0,00", "0,00", "9,99"]);
    expect(rows[13]![0]).toBe("Total 2026");
  });
});

describe("profitFilters and profitYears", () => {
  it("reads the year and the view from the address, with safe defaults", () => {
    expect(profitFilters({ anio: "2025", vista: "caja" }, 2026)).toEqual({
      year: 2025,
      view: "cash",
    });
    expect(profitFilters({}, 2026)).toEqual({ year: 2026, view: "accrual" });
    expect(profitFilters({ anio: "abc", vista: "otra" }, 2026)).toEqual({
      year: 2026,
      view: "accrual",
    });
    expect(profitFilters({ anio: ["2025", "2024"] }, 2026).year).toBe(2026);
  });

  it("lists the years with movements and the current one, newest first", () => {
    expect(
      profitYears(
        data({
          periods: [
            period({
              soldOn: "2024-05-01",
              payments: [{ paidOn: "2025-01-03", amount: 1 }],
            }),
          ],
          purchases: [purchase()],
        }),
        2027,
      ),
    ).toEqual([2027, 2026, 2025, 2024]);
  });

  it("adds the years of losses, of a coverage's end and the selected one", () => {
    expect(
      profitYears(
        data({
          periods: [
            period({ soldOn: "2026-03-10", writtenOffOn: "2027-02-01" }),
          ],
          purchases: [
            purchase({
              payments: [
                {
                  ...purchase().payments[0]!,
                  paidOn: "2026-06-01",
                  coversFrom: "2026-06-01",
                  coversTo: "2028-06-01",
                },
              ],
            }),
          ],
        }),
        2026,
        2030,
      ),
    ).toEqual([2030, 2028, 2027, 2026]);
  });
});
