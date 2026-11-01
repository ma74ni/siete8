import Link from "next/link";

import { type Column, DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/sitio/button";

// Panel templates (E14-02, DESIGN §12.2). Texts from docs/COPY.md §13.

/**
 * The Sublista pattern: what belongs to a record (the client's services, a
 * service's plans) as a compact table with "Editar" on each row and
 * "Agregar …" under it. Each item is edited on its own page, never in a form
 * open in the row.
 */
export function SubList<Row>({
  rows,
  columns,
  rowKey,
  rowLabel,
  editHref,
  label,
  empty,
  add,
  minWidth = "20rem",
}: {
  rows: readonly Row[];
  columns: Column<Row>[];
  rowKey: (row: Row) => string;
  /** Names the row for screen readers: "Editar Hosting". */
  rowLabel: (row: Row) => string;
  editHref: (row: Row) => string;
  label: string;
  empty: string;
  add?: { href: string; label: string };
  minWidth?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <DataTable
        rows={rows}
        rowKey={rowKey}
        label={label}
        empty={empty}
        minWidth={minWidth}
        columns={[
          ...columns,
          {
            header: "Acción",
            hideHeader: true,
            compact: true,
            width: "6rem",
            cell: (row) => (
              <Link
                href={editHref(row)}
                className="inline-flex min-h-11 items-center"
              >
                Editar<span className="sr-only"> {rowLabel(row)}</span>
              </Link>
            ),
          },
        ]}
      />
      {add && (
        <Button href={add.href} variant="secondary" className="self-start">
          {add.label}
        </Button>
      )}
    </div>
  );
}
