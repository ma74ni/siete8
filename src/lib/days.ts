import type { DurationUnit } from "@/lib/clients";

/**
 * Days as the panel stores them ("2026-10-12"): validation, today in Quito,
 * adding periods and the formats shown and read (E11-01).
 */

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
