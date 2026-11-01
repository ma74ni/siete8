import type { ReactNode } from "react";

import { EmptyState } from "@/components/admin/empty-state";
import { Pagination } from "@/components/admin/pagination";
import { cx } from "@/lib/cx";

// Panel organisms (E13-02, DESIGN §12.1).

export type Column<Row> = {
  /** Always set: screen readers read it even when `hideHeader` hides it. */
  header: string;
  cell: (row: Row) => ReactNode;
  /** For a column of buttons: the header is read but not shown. */
  hideHeader?: boolean;
  /** The cell that names the row (the client, the provider): a row header. */
  rowHeader?: boolean;
  /** Tabular figures: prices, amounts, dates written as 24/10/2026. */
  numeric?: boolean;
  /** Weight 500, for the value that matters most in the row (a balance). */
  emphasis?: boolean;
  /** Less vertical padding, for a cell that holds a 48 px button. */
  compact?: boolean;
  /**
   * A fixed width ("10rem", "20%"). With any width set the table keeps the
   * same columns whatever its content, so tables one after another (the
   * catalog by category) line up.
   */
  width?: string;
};

/** Padding of a cell: no right padding on the last column. */
function cellPadding(compact: boolean | undefined, last: boolean): string {
  return cx(compact ? "py-1" : "py-3", !last && "pr-4");
}

/**
 * A panel list as a table: one row per item, defined by its columns. Scrolls
 * sideways on narrow screens instead of squeezing the columns; the scrolling
 * area takes keyboard focus and is named by `label`. With no rows it shows
 * `empty` instead of an empty table. `details` adds a full-width row under an
 * item, for an action that needs room, like "Renovar". `pagination` adds the
 * page links under it (E14-02); the page's rows come from the server.
 */
export function DataTable<Row>({
  rows,
  columns,
  rowKey,
  label,
  empty,
  minWidth = "44rem",
  details,
  pagination,
}: {
  rows: readonly Row[];
  columns: Column<Row>[];
  rowKey: (row: Row) => string;
  /** Names the table for screen readers, e.g. "Por cobrar". */
  label: string;
  /** "Todavía no hay clientes." */
  empty: string;
  /** Below this width the table scrolls instead of wrapping. */
  minWidth?: string;
  details?: (row: Row) => ReactNode | null;
  /** The page (kept within range with `clampPage`) and how to link others. */
  pagination?: {
    page: number;
    pageCount: number;
    href: (page: number) => string;
  };
}) {
  if (rows.length === 0) {
    // A later page with no rows still offers the way back.
    return pagination && pagination.page > 1 ? (
      <div className="flex flex-col gap-4">
        <EmptyState>{empty}</EmptyState>
        <Pagination {...pagination} />
      </div>
    ) : (
      <EmptyState>{empty}</EmptyState>
    );
  }

  const lastIndex = columns.length - 1;
  const cells = (row: Row) =>
    columns.map((column, index) => {
      const className = cx(
        cellPadding(column.compact, index === lastIndex),
        column.numeric && "tabular-nums",
        column.emphasis && "font-medium",
      );
      return column.rowHeader ? (
        <th
          key={index}
          scope="row"
          className={cx(className, !column.emphasis && "font-normal")}
        >
          {column.cell(row)}
        </th>
      ) : (
        <td key={index} className={className}>
          {column.cell(row)}
        </td>
      );
    });

  const fixed = columns.some((column) => column.width);
  const table = (
    // A size container (detail rows measure the visible width, not the
    // table's) and a focusable region, so the keyboard can scroll it too.
    // `relative` makes it the box of what is positioned inside (the
    // screen-reader-only texts of action columns): without it they escaped
    // its clipping and pushed the page sideways on phones (E14-01).
    <div
      className="@container relative overflow-x-auto"
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table
        className={cx(
          "w-full border-collapse text-left",
          fixed && "table-fixed",
        )}
        style={{ minWidth }}
      >
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={cx(
                  cellPadding(false, index === lastIndex),
                  "font-medium",
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.hideHeader ? (
                  <span className="sr-only">{column.header}</span>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        {details ? (
          // One body per item, so its detail row stays with it.
          rows.map((row) => {
            const extra = details(row);
            return (
              <tbody key={rowKey(row)} className="border-b border-border">
                <tr className="align-top">{cells(row)}</tr>
                {extra !== null && extra !== undefined && extra !== false && (
                  <tr>
                    <td colSpan={columns.length} className="pb-3">
                      {/* Stays in view, as wide as the screen, while the
                          table scrolls sideways on a phone. */}
                      <div className="sticky left-0 w-[100cqw] pr-4">
                        {extra}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })
        ) : (
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-border align-top"
              >
                {cells(row)}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
  if (!pagination) return table;
  return (
    <div className="flex flex-col gap-4">
      {table}
      <Pagination {...pagination} />
    </div>
  );
}
