import { addPeriod, parseDay } from "@/lib/days";
import {
  type CatalogService,
  type ClientKind,
  DEFAULT_VAT_RATE,
  type DurationUnit,
} from "@/lib/clients";
import {
  EMAIL,
  normalizeName,
  normalizePhone,
  normalizeTaxId,
  PHONE,
  TAX_ID,
} from "@/lib/client-contact";
import { priceWithVatCents } from "@/lib/price";

/**
 * The clients import and export (RF-CRM-07): the template's columns and the
 * rows of a CSV turned into the `import_clients` payload. Texts from
 * docs/COPY.md §13.
 */

/** Columns of the import template and of the export, in this order. */
export const CSV_COLUMNS = [
  "tipo",
  "nombre",
  "ruc_cedula",
  "celular",
  "correo",
  "notas",
  "servicio",
  "plan",
  "detalle",
  "renueva_cada",
  "fecha_venta",
  "desde",
  "hasta",
  "precio_sin_iva",
  "iva",
  "costo_sin_iva",
  "pagado",
] as const;

type Column = (typeof CSV_COLUMNS)[number];

/** Added in E11-02: files made with the first template still import. */
const OPTIONAL_COLUMNS: readonly Column[] = ["pagado"];

/** "1.234,50", "1234,5", "$20" or "20.00" → 1234.5, 20; null if not money. */
export function parseMoney(text: string): number | null {
  let value = text.replace(/[$\s]/g, "");
  if (value.includes(",")) value = value.replace(/\./g, "").replace(",", ".");
  return /^\d{1,8}(\.\d{1,2})?$/.test(value) ? Number(value) : null;
}

/** "1 año", "6 meses", "15 días", "mensual" or "anual"; empty: one-off. */
export function parseRenewal(
  text: string,
): { value: number; unit: DurationUnit } | null | "invalid" {
  const value = normalizeName(text);
  if (value === "") return null;
  if (value === "mensual") return { value: 1, unit: "month" };
  if (value === "anual") return { value: 1, unit: "year" };
  const match = /^(\d{1,3}) ?(dias?|mes|meses|anos?)$/.exec(value);
  if (!match || Number(match[1]) < 1) return "invalid";
  const word = match[2]!;
  const unit: DurationUnit = word.startsWith("dia")
    ? "day"
    : word.startsWith("mes")
      ? "month"
      : "year";
  return { value: Number(match[1]), unit };
}

export type ImportPeriod = {
  sold_on: string;
  starts_on: string;
  ends_on: string | null;
  price_without_vat: number;
  vat_rate: number;
  cost_without_vat: number;
  /** Total with VAT when the import says it is already paid. */
  paid_amount?: number;
};

export type ImportService = {
  service_id: string;
  plan_id: string | null;
  detail: string | null;
  renews_every_value: number | null;
  renews_every_unit: DurationUnit | null;
  notes?: string | null;
  period: ImportPeriod;
};

/** One element of the `import_clients` payload. */
export type ImportClient = {
  id?: string;
  kind: ClientKind;
  name: string;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  lead_id?: string | null;
  services: ImportService[];
};

export type ImportResult = {
  clients: ImportClient[];
  /** "Fila 3: …", numbered as Excel shows them (the header is row 1). */
  errors: string[];
  newClients: number;
  existingClients: number;
  services: number;
};

const MAX_IMPORT_ROWS = 2000;

/**
 * Turns the rows of an import CSV into the `import_clients` payload. Rows of
 * the same client (same RUC or cédula, or same name without one) are grouped,
 * and the first one gives the client's data. Prices, costs and renewal left
 * empty come from the plan; "hasta" left empty is computed from the renewal.
 * "pagado" (sí) records one payment for the total on the sale day.
 */
export function buildImport(
  rows: string[][],
  catalog: CatalogService[],
  existingTaxIds: ReadonlySet<string>,
  today: string,
): ImportResult {
  const errors: string[] = [];
  const empty = { clients: [], newClients: 0, existingClients: 0, services: 0 };
  const [header, ...body] = rows;
  const columns = (header ?? []).map((cell) => normalizeName(cell));
  const missing = CSV_COLUMNS.filter(
    (column) => !OPTIONAL_COLUMNS.includes(column) && !columns.includes(column),
  );
  if (!header || missing.length > 0) {
    return {
      ...empty,
      errors: [
        `Fila 1: faltan las columnas ${missing.join(", ")}. Usa la plantilla.`,
      ],
    };
  }
  if (body.length === 0) {
    return { ...empty, errors: ["El archivo no tiene filas para importar."] };
  }
  if (body.length > MAX_IMPORT_ROWS) {
    return {
      ...empty,
      errors: [`El archivo tiene más de ${MAX_IMPORT_ROWS} filas. Divídelo.`],
    };
  }

  const services = new Map<string, CatalogService>();
  for (const service of catalog) {
    services.set(service.slug, service);
    services.set(normalizeName(service.name), service);
  }

  const clients = new Map<string, ImportClient>();
  body.forEach((cells, index) => {
    const line = index + 2;
    const cell = (column: Column) =>
      (cells[columns.indexOf(column)] ?? "").trim();
    const problems: string[] = [];

    const name = cell("nombre");
    if (!name) problems.push("falta el nombre");
    const kindText = normalizeName(cell("tipo"));
    const kind: ClientKind | null =
      kindText === "" || kindText === "persona"
        ? "person"
        : kindText === "empresa"
          ? "company"
          : null;
    if (!kind)
      problems.push(`el tipo «${cell("tipo")}» debe ser persona o empresa`);
    const taxId = cell("ruc_cedula")
      ? normalizeTaxId(cell("ruc_cedula"))
      : null;
    if (taxId && !TAX_ID.test(taxId)) {
      problems.push("el RUC tiene 13 dígitos y la cédula 10");
    } else if (taxId && kind === "company" && taxId.length !== 13) {
      problems.push("una empresa lleva RUC de 13 dígitos");
    }
    const phone = cell("celular") ? normalizePhone(cell("celular")) : null;
    if (phone && !PHONE.test(phone))
      problems.push(`el celular «${cell("celular")}» no es válido`);
    const email = cell("correo") || null;
    if (email && !EMAIL.test(email))
      problems.push(`el correo «${email}» no es válido`);

    let service: ImportService | null = null;
    if (cell("servicio")) {
      service = parseServiceCells(cell, services, today, problems);
    }

    if (problems.length > 0) {
      errors.push(`Fila ${line}: ${problems.join("; ")}.`);
      return;
    }

    const key = taxId ?? `nombre:${normalizeName(name)}`;
    let client = clients.get(key);
    if (!client) {
      client = {
        kind: kind!,
        name,
        tax_id: taxId,
        phone,
        email,
        notes: cell("notas") || null,
        services: [],
      };
      clients.set(key, client);
    }
    if (service) client.services.push(service);
  });

  if (errors.length > 0) return { ...empty, errors };
  const list = [...clients.values()];
  const existingClients = list.filter(
    (client) => client.tax_id && existingTaxIds.has(client.tax_id),
  ).length;
  return {
    clients: list,
    errors,
    newClients: list.length - existingClients,
    existingClients,
    services: list.reduce((sum, client) => sum + client.services.length, 0),
  };
}

function parseServiceCells(
  cell: (column: Column) => string,
  services: Map<string, CatalogService>,
  today: string,
  problems: string[],
): ImportService | null {
  const service =
    services.get(cell("servicio")) ??
    services.get(normalizeName(cell("servicio")));
  if (!service) {
    problems.push(`no existe el servicio «${cell("servicio")}»`);
    return null;
  }
  let plan: CatalogService["plans"][number] | null = null;
  if (cell("plan")) {
    plan =
      service.plans.find(
        (candidate) =>
          normalizeName(candidate.name) === normalizeName(cell("plan")),
      ) ?? null;
    if (!plan)
      problems.push(`el plan «${cell("plan")}» no es de ${service.name}`);
  }

  const parsedRenewal = parseRenewal(cell("renueva_cada"));
  if (parsedRenewal === "invalid") {
    problems.push(
      `no se entiende «${cell("renueva_cada")}» en renueva_cada (ej.: 1 mes, 1 año)`,
    );
  }
  const renewal =
    parsedRenewal === "invalid"
      ? null
      : (parsedRenewal ??
        (plan?.duration_value && plan.duration_unit
          ? { value: plan.duration_value, unit: plan.duration_unit }
          : null));

  const day = (column: Column) => {
    if (!cell(column)) return null;
    const parsed = parseDay(cell(column));
    if (!parsed)
      problems.push(`la fecha «${cell(column)}» no es válida (usa dd/mm/aaaa)`);
    return parsed;
  };
  const startsOn = day("desde");
  if (!cell("desde")) problems.push("falta la fecha desde");
  const soldOn = day("fecha_venta") ?? startsOn ?? today;
  let endsOn = day("hasta");
  if (!cell("hasta") && startsOn && renewal) {
    endsOn = addPeriod(startsOn, renewal.value, renewal.unit);
  }
  if (startsOn && endsOn && endsOn <= startsOn) {
    problems.push("hasta debe ser posterior a desde");
  }

  const amount = (column: Column, fallback: number | null | undefined) => {
    if (!cell(column)) return fallback ?? null;
    const parsed = parseMoney(cell(column));
    if (parsed === null)
      problems.push(`el valor «${cell(column)}» de ${column} no es válido`);
    return parsed;
  };
  const price = amount("precio_sin_iva", plan?.price_without_vat);
  if (!cell("precio_sin_iva") && !plan)
    problems.push("falta el precio sin IVA");
  const cost = amount("costo_sin_iva", plan?.cost_without_vat) ?? 0;
  let vatRate = plan?.vat_rate ?? DEFAULT_VAT_RATE;
  if (cell("iva")) {
    const percent = parseMoney(cell("iva").replace("%", ""));
    if (percent === null || percent > 100) {
      problems.push(`el IVA «${cell("iva")}» no es válido (ej.: 15)`);
    } else {
      vatRate = Math.round(percent * 100) / 10_000;
    }
  }

  const paidText = normalizeName(cell("pagado"));
  const paid = ["si", "x", "1", "pagado"].includes(paidText);
  if (!paid && !["", "no", "0"].includes(paidText)) {
    problems.push(`pagado «${cell("pagado")}» debe ser sí o no`);
  }

  if (!startsOn || price === null) return null;
  return {
    service_id: service.id,
    plan_id: plan?.id ?? null,
    detail: cell("detalle") || null,
    renews_every_value: renewal?.value ?? null,
    renews_every_unit: renewal?.unit ?? null,
    period: {
      sold_on: soldOn,
      starts_on: startsOn,
      ends_on: endsOn,
      price_without_vat: price,
      vat_rate: vatRate,
      cost_without_vat: cost,
      ...(paid && {
        paid_amount: priceWithVatCents(price, vatRate) / 100,
      }),
    },
  };
}

/** Result of the import action, shown by the import form. */
export type ImportState =
  | { status: "idle" }
  | { status: "error"; message: string; errors: string[] }
  | {
      status: "preview";
      newClients: number;
      existingClients: number;
      services: number;
    }
  | { status: "done"; message: string };
