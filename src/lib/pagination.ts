/** Rows per page of a panel list (E14-02, DESIGN §12.2). */
export const PAGE_SIZE = 25;

/**
 * The page asked for in the address (`?pagina=2`): 1 when missing or not
 * plain digits ("1e300", " 3" or "0x10" would reach the query as huge or odd
 * numbers).
 */
export function pageNumber(value: unknown): number {
  const text = Array.isArray(value) ? value[0] : value;
  if (typeof text !== "string" || !/^\d+$/.test(text)) return 1;
  const page = Number(text);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/** The page within the list: a page past the last one shows the last. */
export function clampPage(page: number, pages: number): number {
  return Math.min(Math.max(1, page), Math.max(1, pages));
}

/** How many pages `total` rows take; an empty list still has page 1. */
export function pageCount(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** First and last row of a page, zero based, for a query's `range`. */
export function pageRange(
  page: number,
  pageSize = PAGE_SIZE,
): { from: number; to: number } {
  const from = (Math.max(1, page) - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

/** The address of a page: page 1 drops the parameter, others set it. */
export function pageHref(
  path: string,
  params: Record<string, string | undefined>,
  page: number,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "pagina") query.set(key, value);
  }
  if (page > 1) query.set("pagina", String(page));
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}
