import Link from "next/link";

// Texts from docs/COPY.md §13 (Panel: comunes).

/**
 * The page links under a list (E14-02): "Anteriores", "Página 2 de 5" and
 * "Siguientes". Nothing with a single page.
 */
export function Pagination({
  page,
  pageCount,
  href,
  label = "Páginas",
}: {
  page: number;
  pageCount: number;
  href: (page: number) => string;
  /** Another name when a page has two paged lists ("Páginas de pagos"). */
  label?: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-4">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          className="inline-flex min-h-11 items-center"
        >
          Anteriores
        </Link>
      )}
      <p className="text-small">
        Página {page} de {pageCount}
      </p>
      {page < pageCount && (
        <Link
          href={href(page + 1)}
          className="inline-flex min-h-11 items-center"
        >
          Siguientes
        </Link>
      )}
    </nav>
  );
}
