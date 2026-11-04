import { describe, expect, it } from "vitest";

import {
  buildImport,
  CSV_COLUMNS,
  parseMoney,
  parseRenewal,
} from "@/lib/client-import";
import type { CatalogService } from "@/lib/clients";

describe("parsers", () => {
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
