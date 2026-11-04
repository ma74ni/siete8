/** CSV as Excel reads and writes it in Spanish (E11-01). */

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
