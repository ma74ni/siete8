import type { Database } from "@/lib/database.types";
import { formatCents } from "@/lib/price";

/**
 * Pure helpers of the clients module (E11-01, SRS 3.9): renewal periods,
 * expiry, profit in cents, and the CSV used to import and export clients.
 * Texts from docs/COPY.md §13.
 */

export type ClientKind = Database["public"]["Enums"]["client_kind"];
export type DurationUnit = Database["public"]["Enums"]["duration_unit"];

export const CLIENT_KIND_LABELS: Record<ClientKind, string> = {
  person: "Persona",
  company: "Empresa",
};

/** Options of "Se renueva cada"; the empty value is a one-off payment. */
export const RENEWAL_UNIT_LABELS: Record<DurationUnit, string> = {
  day: "Días",
  month: "Meses",
  year: "Años",
};

const UNIT_WORDS: Record<DurationUnit, [string, string]> = {
  day: ["día", "días"],
  month: ["mes", "meses"],
  year: ["año", "años"],
};

/** Default VAT rate for a sale without plan. */
export const DEFAULT_VAT_RATE = 0.15;

// Dates -------------------------------------------------------------------------

/** Dates are days ("2026-10-12"), handled in UTC so no time zone shifts them. */
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDay(value: string): boolean {
  const match = DAY.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Today in Quito (UTC-05:00 all year). */
export function todayInQuito(now = new Date()): string {
  return new Date(now.getTime() - 5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

/**
 * The day `value` `unit`s after `day`. A month or year that lands past the end
 * of a shorter month stays on its last day: 31 Jan + 1 month → 28 Feb.
 */
export function addPeriod(
  day: string,
  value: number,
  unit: DurationUnit,
): string {
  const start = new Date(`${day}T00:00:00Z`);
  if (unit === "day") {
    start.setUTCDate(start.getUTCDate() + value);
    return start.toISOString().slice(0, 10);
  }
  const months = unit === "month" ? value : value * 12;
  const target = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return target.toISOString().slice(0, 10);
}

/** "12 de octubre de 2026". */
export function formatDay(day: string): string {
  return new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}

/** "12/10/2026", as Excel shows it in Ecuador. */
export function formatDayShort(day: string): string {
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
}

export type Expiry =
  | { state: "none"; label: string }
  | { state: "expired" | "active"; label: string; day: string };

/** "Venció el …", "Vence el …" or "Sin vencimiento". */
export function expiry(expiresOn: string | null, today: string): Expiry {
  if (!expiresOn) return { state: "none", label: "Sin vencimiento" };
  return expiresOn <= today
    ? {
        state: "expired",
        label: `Venció el ${formatDay(expiresOn)}`,
        day: expiresOn,
      }
    : {
        state: "active",
        label: `Vence el ${formatDay(expiresOn)}`,
        day: expiresOn,
      };
}

/** "1 año", "6 meses", or "Pago único" when it does not renew. */
export function renewalText(
  value: number | null,
  unit: DurationUnit | null,
): string {
  if (!value || !unit) return "Pago único";
  return `${value} ${UNIT_WORDS[unit][value === 1 ? 0 : 1]}`;
}

// Money ---------------------------------------------------------------------------

const toCents = (amount: number) => Math.round(amount * 100);

/** Profit of a sale without VAT, in cents: price − direct cost. */
export function profitCents(priceWithoutVat: number, cost: number): number {
  return toCents(priceWithoutVat) - toCents(cost);
}

/** Like `formatCents`, with a minus sign for losses: `-$3,50`. */
export function formatSignedCents(cents: number): string {
  return cents < 0 ? `-${formatCents(-cents)}` : formatCents(cents);
}

// Identification and contact -----------------------------------------------------

/**
 * Only digits. Excel drops the leading zero of a number cell, so a 9-digit
 * cédula or a 12-digit RUC gets it back (provinces 01 to 09).
 */
export function normalizeTaxId(value: string): string {
  const digits = value.replace(/[\s.-]/g, "");
  return /^\d{9}$|^\d{12}$/.test(digits) ? `0${digits}` : digits;
}

export const TAX_ID = /^\d{10}(\d{3})?$/;

/** Without spaces, dashes or parentheses; a cell phone that lost its 0 gets it back. */
export function normalizePhone(value: string): string {
  const phone = value.replace(/[\s()-]/g, "");
  return /^9\d{8}$/.test(phone) ? `0${phone}` : phone;
}

export const PHONE = /^\+?[0-9]{7,20}$/;
export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// CSV -------------------------------------------------------------------------------

/**
 * Reads a CSV as Excel saves it: `;` (Spanish locale), `,` or tab as
 * separator, quoted fields, CRLF and the UTF-8 BOM.
 */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const separator = [";", "\t", ","].reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length
      ? candidate
      : best,
  );

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Excel leaves rows of empty cells at the end.
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** CSV that Excel opens with accents and columns right: BOM, `;` and CRLF. */
export function toCsv(rows: string[][]): string {
  const escape = (cell: string) =>
    /[";\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
  return `﻿${rows.map((row) => row.map(escape).join(";")).join("\r\n")}\r\n`;
}

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
] as const;

type Column = (typeof CSV_COLUMNS)[number];

/** Lowercase without accents or extra spaces, to match names typed by hand. */
export function normalizeName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "12/10/2026", "12-10-2026" or "2026-10-12" → "2026-10-12". */
export function parseDay(text: string): string | null {
  const value = text.trim();
  let day = value;
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);
  if (local) {
    const [, date, month, year] = local;
    day = `${year}-${month!.padStart(2, "0")}-${date!.padStart(2, "0")}`;
  }
  return isDay(day) ? day : null;
}

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

/** The catalog as the import needs it: services with their plans and costs. */
export type CatalogService = {
  id: string;
  name: string;
  slug: string;
  plans: {
    id: string;
    name: string;
    price_without_vat: number;
    vat_rate: number;
    duration_value: number | null;
    duration_unit: DurationUnit | null;
    cost_without_vat: number | null;
  }[];
};

export type ImportPeriod = {
  sold_on: string;
  starts_on: string;
  ends_on: string | null;
  price_without_vat: number;
  vat_rate: number;
  cost_without_vat: number;
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
  const missing = CSV_COLUMNS.filter((column) => !columns.includes(column));
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

/** A decimal with comma, as Excel in Spanish expects: 20.5 → "20,50". */
export function formatDecimal(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}
