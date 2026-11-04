/**
 * A client's identification and contact as typed by hand or by Excel
 * (E11-01): RUC or cédula, cell phone, email and names to match.
 */

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

/** Lowercase without accents or extra spaces, to match names typed by hand. */
export function normalizeName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
