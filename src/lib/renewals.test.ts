import { describe, expect, it } from "vitest";

import {
  type ClientServiceRow,
  crossAlerts,
  dueLimit,
  dueReport,
  dueReportCsvRows,
  nextPeriod,
  type PurchaseRow,
  weeklyDigest,
} from "@/lib/renewals";

// Made-up clients, providers and amounts (SRS 3.9: never the real issuer).

const TODAY = "2026-10-23";

function period(
  overrides: Partial<ClientServiceRow["client_service_period"][number]> = {},
) {
  return {
    id: "p1",
    sold_on: "2025-11-05",
    starts_on: "2025-11-05",
    ends_on: "2026-11-05",
    price_without_vat: 17.99,
    vat_rate: 0.15,
    cost_without_vat: 8,
    written_off_on: null,
    created_at: "2025-11-05T10:00:00Z",
    client_payment: [{ amount: 20.69 }],
    ...overrides,
  };
}

function service(overrides: Partial<ClientServiceRow> = {}): ClientServiceRow {
  return {
    id: "cs1",
    detail: "heladeria.test",
    status: "active",
    cancelled_at: null,
    renews_every_value: 1,
    renews_every_unit: "year",
    service: { name: "Hosting" },
    client: { id: "c1", name: "Heladería Polar" },
    client_service_period: [period()],
    ...overrides,
  };
}

function purchase(overrides: Partial<PurchaseRow> = {}): PurchaseRow {
  return {
    id: "pu1",
    concept: "Hosting compartido",
    status: "active",
    auto_renew: true,
    renews_every_value: 1,
    renews_every_unit: "year",
    client_service_id: null,
    provider: { name: "Proveedor Uno" },
    purchase_service: [{ service: { name: "Hosting" } }],
    purchase_payment: [
      {
        covers_from: "2025-11-10",
        covers_to: "2026-11-10",
        created_at: "2025-11-10T10:00:00Z",
        amount: 100,
        vat_amount: 15,
        isd_amount: 5,
      },
    ],
    license_assignment: [],
    ...overrides,
  };
}

describe("dueLimit", () => {
  it("is 30 days after today", () => {
    expect(dueLimit(TODAY)).toBe("2026-11-22");
  });
});

describe("nextPeriod", () => {
  it("starts when the previous one ends, lasts one cycle and keeps price and cost", () => {
    expect(nextPeriod(service(), period(), TODAY)).toEqual({
      sold_on: TODAY,
      starts_on: "2026-11-05",
      ends_on: "2027-11-05",
      price_without_vat: 17.99,
      vat_rate: 0.15,
      cost_without_vat: 8,
    });
  });

  it("follows monthly cycles to the last day of a shorter month", () => {
    expect(
      nextPeriod(
        service({ renews_every_value: 1, renews_every_unit: "month" }),
        period({ ends_on: "2027-01-31" }),
        TODAY,
      )?.ends_on,
    ).toBe("2027-02-28");
  });

  it("starts today when the previous period never ended", () => {
    expect(
      nextPeriod(service(), period({ ends_on: null }), TODAY)?.starts_on,
    ).toBe(TODAY);
  });

  it("is null for one-off services and services without periods", () => {
    expect(
      nextPeriod(
        service({ renews_every_value: null, renews_every_unit: null }),
        period(),
        TODAY,
      ),
    ).toBeNull();
    expect(nextPeriod(service(), null, TODAY)).toBeNull();
  });
});

describe("dueReport: clients", () => {
  it("lists active services expiring in 30 days or expired, the expired first", () => {
    const report = dueReport(
      [
        service({ id: "soon" }),
        service({
          id: "late",
          client: { id: "c2", name: "Ferretería Andes" },
          client_service_period: [period({ ends_on: "2026-10-01" })],
        }),
        service({
          id: "far",
          client_service_period: [period({ ends_on: "2026-12-31" })],
        }),
        service({ id: "cancelled", status: "cancelled" }),
        service({
          id: "forever",
          client_service_period: [period({ ends_on: null })],
        }),
      ],
      [],
      TODAY,
    );
    expect(report.clients.map((row) => row.id)).toEqual(["late", "soon"]);
    expect(report.clients[0]).toMatchObject({
      client: "Ferretería Andes",
      service: "Hosting, heladeria.test",
      expiry: "Venció el 1 de octubre de 2026",
      expired: true,
      payment: "Pagado",
      priceWithVatCents: 2069,
      renewal: "1 año",
    });
    expect(report.clients[1]?.expiry).toBe("Vence el 5 de noviembre de 2026");
  });

  it("uses the latest period and its balance", () => {
    const [row] = dueReport(
      [
        service({
          client_service_period: [
            period({ id: "old", ends_on: "2025-11-05" }),
            period({
              id: "new",
              starts_on: "2026-11-01",
              ends_on: "2026-11-20",
              client_payment: [{ amount: 10 }],
            }),
          ],
        }),
      ],
      [],
      TODAY,
    ).clients;
    expect(row?.expiresOn).toBe("2026-11-20");
    expect(row?.payment).toBe("Debe $10,69");
  });

  it("has no next period for one-off services", () => {
    const [row] = dueReport(
      [service({ renews_every_value: null, renews_every_unit: null })],
      [],
      TODAY,
    ).clients;
    expect(row?.next).toBeNull();
    expect(row?.renewal).toBe("Pago único");
  });
});

describe("dueReport: purchases", () => {
  it("lists active purchases whose last payment ends in 30 days or ended", () => {
    const report = dueReport(
      [],
      [
        purchase(),
        purchase({
          id: "paid-ahead",
          purchase_payment: [
            {
              covers_from: "2026-10-01",
              covers_to: "2027-10-01",
              created_at: "2026-10-01T10:00:00Z",
              amount: 1,
              vat_amount: 0,
              isd_amount: 0,
            },
          ],
        }),
        purchase({ id: "never-paid", purchase_payment: [] }),
        purchase({ id: "cancelled", status: "cancelled" }),
      ],
      TODAY,
    );
    expect(report.purchases).toEqual([
      {
        id: "pu1",
        provider: "Proveedor Uno",
        concept: "Hosting compartido",
        chargedTo: "Hosting",
        expiresOn: "2026-11-10",
        expiry: "Vence el 10 de noviembre de 2026",
        expired: false,
        renewal: "Automática",
        autoRenew: true,
        lastTotalCents: 12000,
      },
    ]);
  });

  it("is charged to the client's service, or to General without services", () => {
    const report = dueReport(
      [service()],
      [
        purchase({ id: "own", client_service_id: "cs1", purchase_service: [] }),
        purchase({ id: "general", purchase_service: [] }),
      ],
      TODAY,
    );
    expect(report.purchases.map((row) => row.chargedTo)).toEqual([
      "Heladería Polar: Hosting, heladeria.test",
      "General",
    ]);
  });
});

describe("crossAlerts", () => {
  const services = (rows: ClientServiceRow[]) =>
    new Map(rows.map((row) => [row.id, row]));

  it("flags a purchase of a client who owes the service it is for", () => {
    const owing = service({
      client_service_period: [period({ client_payment: [] })],
    });
    expect(
      crossAlerts(
        [
          purchase({
            client_service_id: "cs1",
            concept: "Dominio heladeria.test",
          }),
        ],
        services([owing]),
      ),
    ).toEqual([
      {
        purchaseId: "pu1",
        text: "Dominio heladeria.test es de Heladería Polar, que te debe $20,69 de Hosting, heladeria.test.",
      },
    ]);
  });

  it("flags a purchase of a client who cancelled, with the day in Quito", () => {
    const cancelled = service({
      status: "cancelled",
      // 03:00 UTC is still the 15th in Quito.
      cancelled_at: "2026-10-16T03:00:00Z",
    });
    expect(
      crossAlerts(
        [
          purchase({
            client_service_id: "cs1",
            concept: "Dominio heladeria.test",
          }),
        ],
        services([cancelled]),
      )[0]?.text,
    ).toBe(
      "Dominio heladeria.test es de Heladería Polar, que canceló Hosting, heladeria.test el 15 de octubre de 2026.",
    );
  });

  it("says nothing for a client who paid", () => {
    expect(
      crossAlerts(
        [purchase({ client_service_id: "cs1" })],
        services([service()]),
      ),
    ).toEqual([]);
  });

  it("counts shared licenses still assigned to cancelled services", () => {
    const rows = services([
      service({ id: "gone-1", status: "cancelled" }),
      service({
        id: "gone-2",
        status: "cancelled",
        client: { id: "c2", name: "Ferretería Andes" },
      }),
      service({ id: "kept" }),
    ]);
    const licenses = (assigned: PurchaseRow["license_assignment"]) =>
      crossAlerts(
        [purchase({ concept: "Microsoft 365", license_assignment: assigned })],
        rows,
      );

    expect(
      licenses([
        { email: "ana@heladeria.test", client_service_id: "gone-1" },
        { email: null, client_service_id: "gone-2" },
        { email: "luis@polar.test", client_service_id: "kept" },
        { email: "libre@siete8.test", client_service_id: null },
      ])[0]?.text,
    ).toBe(
      "Microsoft 365: 2 licencias de clientes que cancelaron (ana@heladeria.test, Ferretería Andes). Quítalas antes de renovar.",
    );
    expect(
      licenses([
        { email: "ana@heladeria.test", client_service_id: "gone-1" },
      ])[0]?.text,
    ).toBe(
      "Microsoft 365: 1 licencia de un cliente que canceló (ana@heladeria.test). Quítalas antes de renovar.",
    );
  });

  it("ignores cancelled purchases", () => {
    expect(
      crossAlerts(
        [purchase({ status: "cancelled", client_service_id: "cs1" })],
        services([service({ status: "cancelled" })]),
      ),
    ).toEqual([]);
  });
});

describe("dueReportCsvRows", () => {
  it("lists clients, then providers, with dd/mm/aaaa dates", () => {
    const rows = dueReportCsvRows(dueReport([service()], [purchase()], TODAY));
    expect(rows).toEqual([
      ["tipo", "nombre", "concepto", "vence", "monto", "renovacion"],
      [
        "Cliente",
        "Heladería Polar",
        "Hosting, heladeria.test",
        "05/11/2026",
        "20,69",
        "1 año",
      ],
      [
        "Proveedor",
        "Proveedor Uno",
        "Hosting compartido",
        "10/11/2026",
        "120,00",
        "Automática",
      ],
    ]);
  });
});

describe("weeklyDigest", () => {
  const SITE = "https://siete8.com";

  it("is not sent when nothing is due and there are no alerts", () => {
    expect(
      weeklyDigest({ alerts: [], clients: [], purchases: [] }, SITE),
    ).toBeNull();
  });

  it("lists alerts, clients and providers, and links to the panel", () => {
    const digest = weeklyDigest(
      dueReport(
        [service({ client_service_period: [period({ client_payment: [] })] })],
        [
          purchase({
            client_service_id: "cs1",
            concept: "Dominio heladeria.test",
          }),
        ],
        TODAY,
      ),
      SITE,
    );
    expect(digest?.subject).toBe(
      "Siete8: 2 vencimientos en los próximos 30 días",
    );
    expect(digest?.text).toBe(
      [
        "Hola. Esto vence en los próximos 30 días o ya venció.",
        "",
        "Revisa antes de renovar (1):",
        "- Dominio heladeria.test es de Heladería Polar, que te debe $20,69 de Hosting, heladeria.test.",
        "",
        "Tus clientes (1):",
        "- Heladería Polar: Hosting, heladeria.test. Vence el 5 de noviembre de 2026. Pendiente.",
        "",
        "Tus proveedores (1):",
        "- Proveedor Uno: Dominio heladeria.test. Vence el 10 de noviembre de 2026. Se renueva sola.",
        "",
        "Renueva y registra los pagos en el panel: https://siete8.com/admin/por-vencer.",
        "",
        "Panel de Siete8.",
      ].join("\n"),
    );
  });

  it("is still sent with only alerts, with its own subject", () => {
    const digest = weeklyDigest(
      {
        alerts: [{ purchaseId: "pu1", text: "Dominio x es de Y." }],
        clients: [],
        purchases: [],
      },
      SITE,
    );
    expect(digest?.subject).toBe("Siete8: revisa antes de renovar");
    expect(digest?.text).toContain("Revisa antes de renovar (1):");
  });

  it("uses the singular for one item and skips empty sections", () => {
    const digest = weeklyDigest(dueReport([service()], [], TODAY), SITE);
    expect(digest?.subject).toBe(
      "Siete8: 1 vencimiento en los próximos 30 días",
    );
    expect(digest?.text).not.toContain("Tus proveedores");
    expect(digest?.text).not.toContain("Revisa antes de renovar");
  });
});
