import { describe, expect, it } from "vitest";

import {
  addPeriod,
  buildImport,
  type CatalogService,
  CSV_COLUMNS,
  endsAfter,
  expiry,
  formatSignedCents,
  normalizePhone,
  normalizeTaxId,
  parseCsv,
  parseDay,
  parseMoney,
  parseRenewal,
  planRenewal,
  profitCents,
  renewalText,
  todayInQuito,
  toCsv,
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

describe("addPeriod", () => {
  it("adds days, months and years", () => {
    expect(addPeriod("2026-10-12", 30, "day")).toBe("2026-11-11");
    expect(addPeriod("2026-10-12", 1, "month")).toBe("2026-11-12");
    expect(addPeriod("2026-10-12", 2, "year")).toBe("2028-10-12");
  });

  it("stays on the last day of a shorter month", () => {
    expect(addPeriod("2026-01-31", 1, "month")).toBe("2026-02-28");
    expect(addPeriod("2028-02-29", 1, "year")).toBe("2029-02-28");
  });
});

describe("todayInQuito", () => {
  it("is still yesterday in Quito before 05:00 UTC", () => {
    expect(todayInQuito(new Date("2026-10-13T03:00:00Z"))).toBe("2026-10-12");
    expect(todayInQuito(new Date("2026-10-13T06:00:00Z"))).toBe("2026-10-13");
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

describe("normalizeTaxId and normalizePhone", () => {
  it("restores the leading zero that Excel drops", () => {
    expect(normalizeTaxId("912345678")).toBe("0912345678");
    expect(normalizeTaxId("990000000001")).toBe("0990000000001");
    expect(normalizeTaxId("1790000000001")).toBe("1790000000001");
    expect(normalizePhone("991234567")).toBe("0991234567");
    expect(normalizePhone("099-123 4567")).toBe("0991234567");
  });
});

describe("parsers", () => {
  it("reads dates as Excel writes them in Ecuador", () => {
    expect(parseDay("1/10/2026")).toBe("2026-10-01");
    expect(parseDay("2026-10-01")).toBe("2026-10-01");
    expect(parseDay("31/02/2026")).toBeNull();
    expect(parseDay("10/2026")).toBeNull();
  });

  it("reads money with comma or point", () => {
    expect(parseMoney("1.234,50")).toBe(1234.5);
    expect(parseMoney("$20")).toBe(20);
    expect(parseMoney("20.5")).toBe(20.5);
    expect(parseMoney("veinte")).toBeNull();
  });

  it("reads the renewal", () => {
    expect(parseRenewal("2 años")).toEqual({ value: 2, unit: "year" });
    expect(parseRenewal("1 Mes")).toEqual({ value: 1, unit: "month" });
    expect(parseRenewal("anual")).toEqual({ value: 1, unit: "year" });
    expect(parseRenewal("")).toBeNull();
    expect(parseRenewal("a veces")).toBe("invalid");
  });
});

describe("CSV", () => {
  it("reads semicolons, quotes, CRLF and the BOM", () => {
    const text = '﻿nombre;notas\r\n"Heladería; Sur";"dice ""hola"""\r\n;\r\n';
    expect(parseCsv(text)).toEqual([
      ["nombre", "notas"],
      ["Heladería; Sur", 'dice "hola"'],
    ]);
  });

  it("reads commas when the file uses them", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("writes what it reads", () => {
    const rows = [
      ["nombre", "notas"],
      ["Heladería; Sur", 'dice "hola"\nadiós'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("buildImport", () => {
  const catalog: CatalogService[] = [
    {
      id: "s-hosting",
      name: "Hosting",
      slug: "hosting",
      plans: [
        {
          id: "p-basic",
          name: "Básico",
          price_without_vat: 50,
          vat_rate: 0.15,
          duration_value: 1,
          duration_unit: "year",
          cost_without_vat: 20,
        },
      ],
    },
    {
      id: "s-dev",
      name: "Apps y desarrollo a medida",
      slug: "apps-y-desarrollo-a-medida",
      plans: [],
    },
  ];
  const header = [...CSV_COLUMNS];
  const row = (values: Partial<Record<(typeof CSV_COLUMNS)[number], string>>) =>
    CSV_COLUMNS.map((column) => values[column] ?? "");

  it("groups the rows of a client and fills in from the plan", () => {
    const result = buildImport(
      [
        header,
        row({
          tipo: "Empresa",
          nombre: "Heladería",
          ruc_cedula: "1790000000001",
          servicio: "hosting",
          plan: "basico",
          desde: "01/10/2026",
        }),
        row({
          nombre: "Heladería",
          ruc_cedula: "1790000000001",
          servicio: "apps y desarrollo a medida",
          detalle: "Mantenimiento del POS",
          renueva_cada: "1 mes",
          desde: "01/10/2026",
          precio_sin_iva: "20,00",
        }),
        row({ nombre: "Ana Pérez", celular: "991234567" }),
      ],
      catalog,
      new Set(["1790000000001"]),
      "2026-10-12",
    );

    expect(result.errors).toEqual([]);
    expect(result.newClients).toBe(1);
    expect(result.existingClients).toBe(1);
    expect(result.services).toBe(2);
    const [shop, ana] = result.clients;
    expect(shop?.kind).toBe("company");
    expect(shop?.services[0]).toEqual({
      service_id: "s-hosting",
      plan_id: "p-basic",
      detail: null,
      renews_every_value: 1,
      renews_every_unit: "year",
      period: {
        sold_on: "2026-10-01",
        starts_on: "2026-10-01",
        ends_on: "2027-10-01",
        price_without_vat: 50,
        vat_rate: 0.15,
        cost_without_vat: 20,
      },
    });
    expect(shop?.services[1]?.period).toMatchObject({
      ends_on: "2026-11-01",
      price_without_vat: 20,
      vat_rate: 0.15,
      cost_without_vat: 0,
    });
    expect(ana).toMatchObject({
      kind: "person",
      phone: "0991234567",
      services: [],
    });
  });

  it("reports every problem by row and returns nothing to import", () => {
    const result = buildImport(
      [
        header,
        row({ nombre: "Bien" }),
        row({ ruc_cedula: "123", servicio: "nada", desde: "hoy" }),
        row({
          nombre: "Sin precio",
          servicio: "hosting",
          desde: "01/10/2026",
          hasta: "01/09/2026",
          precio_sin_iva: "x",
        }),
      ],
      catalog,
      new Set(),
      "2026-10-12",
    );

    expect(result.clients).toEqual([]);
    expect(result.errors).toEqual([
      "Fila 3: falta el nombre; el RUC tiene 13 dígitos y la cédula 10; no existe el servicio «nada».",
      "Fila 4: hasta debe ser posterior a desde; el valor «x» de precio_sin_iva no es válido.",
    ]);
  });

  it("records the total as paid when pagado says so", () => {
    const result = buildImport(
      [
        header,
        row({
          nombre: "Ana",
          servicio: "hosting",
          plan: "básico",
          desde: "01/10/2026",
          pagado: "Sí",
        }),
        row({
          nombre: "Luis",
          servicio: "hosting",
          plan: "básico",
          desde: "01/10/2026",
          pagado: "tal vez",
        }),
      ],
      catalog,
      new Set(),
      "2026-10-12",
    );
    expect(result.errors).toEqual([
      "Fila 3: pagado «tal vez» debe ser sí o no.",
    ]);
    const ok = buildImport(
      [
        header,
        row({
          nombre: "Ana",
          servicio: "hosting",
          plan: "básico",
          desde: "01/10/2026",
          pagado: "si",
        }),
      ],
      catalog,
      new Set(),
      "2026-10-12",
    );
    expect(ok.clients[0]?.services[0]?.period.paid_amount).toBe(57.5);
  });

  it("imports files made before the pagado column existed", () => {
    const old = CSV_COLUMNS.filter((column) => column !== "pagado");
    const result = buildImport(
      [[...old], old.map((column) => (column === "nombre" ? "Ana" : ""))],
      catalog,
      new Set(),
      "2026-10-12",
    );
    expect(result.errors).toEqual([]);
  });

  it("rejects a file without the template columns", () => {
    expect(
      buildImport([["nombre"]], catalog, new Set(), "2026-10-12").errors[0],
    ).toMatch(/^Fila 1: faltan las columnas tipo, ruc_cedula/);
  });
});
