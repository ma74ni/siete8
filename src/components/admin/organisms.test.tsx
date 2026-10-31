import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { type Column, DataTable } from "@/components/admin/data-table";
import { Disclosure } from "@/components/admin/disclosure";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusText } from "@/components/admin/status-text";

// Outside Next there is no router: a plain link is enough to check markup.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const html = (node: ReactNode) => renderToStaticMarkup(node);

describe("PageHeader", () => {
  it("has the title as the only h1, with the link back and the actions", () => {
    const markup = html(
      <PageHeader
        title="Nuevo lead"
        intro="Para registrar a quien te escribió por WhatsApp."
        back={{ href: "/admin/leads", label: "Volver a leads" }}
        actions={<button>Crear</button>}
      />,
    );
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain(
      '<a href="/admin/leads" class="text-small">Volver a leads</a>',
    );
    expect(markup).toContain(
      '<p class="max-w-[68ch]">Para registrar a quien te escribió por WhatsApp.</p>',
    );
    expect(markup).toContain("<button>Crear</button>");
  });

  it("wraps an introduction with a link in its paragraph", () => {
    const markup = html(
      <PageHeader
        title="Compra"
        intro={
          <>
            De <a href="#proveedor">Proveedor Uno</a>.
          </>
        }
      />,
    );
    expect(markup).toContain(
      '<p class="max-w-[68ch]">De <a href="#proveedor">Proveedor Uno</a>.</p>',
    );
  });

  it("leaves out the link back and the actions when there are none", () => {
    const markup = html(<PageHeader title="Clientes" />);
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain("<button");
  });
});

type Row = { id: string; client: string; balance: string };
const rows: Row[] = [
  { id: "1", client: "Heladería Polar", balance: "$20,69" },
  { id: "2", client: "Ferretería Andes", balance: "$5,00" },
];
const columns: Column<Row>[] = [
  { header: "Cliente", cell: (row) => row.client, rowHeader: true },
  {
    header: "Saldo",
    cell: (row) => row.balance,
    numeric: true,
    emphasis: true,
  },
  {
    header: "Acciones",
    cell: () => <button>Pagado hoy</button>,
    hideHeader: true,
    compact: true,
  },
];
const table = (props: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) =>
  html(
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      label="Por cobrar"
      empty="Nadie te debe nada."
      {...props}
    />,
  );

describe("DataTable", () => {
  it("shows the empty message instead of an empty table", () => {
    const markup = table({ rows: [] });
    expect(markup).not.toContain("<table");
    expect(markup).toContain("<p>Nadie te debe nada.</p>");
  });

  it("is a named, focusable region so the keyboard can scroll it", () => {
    const markup = table();
    expect(markup).toContain(
      'role="region" aria-label="Por cobrar" tabindex="0"',
    );
    expect(markup).toContain('<caption class="sr-only">Por cobrar</caption>');
    expect(markup).toContain('style="min-width:44rem"');
  });

  it("renders a header per column, hiding only the visual one of a button column", () => {
    const markup = table();
    expect(markup.match(/<th scope="col"/g)).toHaveLength(3);
    expect(markup).toContain('<span class="sr-only">Acciones</span>');
  });

  it("names each row with its row header cell", () => {
    expect(table()).toContain(
      '<th scope="row" class="py-3 pr-4 font-normal">Heladería Polar</th>',
    );
  });

  it("styles numeric, emphasized and compact cells, without right padding on the last", () => {
    const markup = table();
    expect(markup).toContain(
      '<td class="py-3 pr-4 tabular-nums font-medium">$20,69</td>',
    );
    expect(markup).toContain(
      '<td class="py-1"><button>Pagado hoy</button></td>',
    );
  });

  it("adds a full-width detail row only under the items that have one", () => {
    const markup = table({
      details: (row) => (row.id === "1" ? <span>Renovar</span> : null),
    });
    expect(markup.match(/<tbody/g)).toHaveLength(2);
    expect(markup.match(/colSpan="3"|colspan="3"/g)).toHaveLength(1);
    expect(markup).toContain("<span>Renovar</span>");
  });
});

describe("Disclosure", () => {
  const body = <p>Formulario</p>;

  it("is a bordered box with a title by default", () => {
    const markup = html(
      <Disclosure summary="Agregar servicio" id="nuevo">
        {body}
      </Disclosure>,
    );
    expect(markup).toContain('<details id="nuevo" class="rounded-control');
    expect(markup).toContain(">Agregar servicio<svg");
  });

  it("shows its summary as a secondary button in the action variant", () => {
    const markup = html(
      <Disclosure summary="Renovar" variant="action">
        {body}
      </Disclosure>,
    );
    expect(markup).toContain("border-[1.5px] border-fg");
    expect(markup).toContain("min-h-12");
  });

  it("is just its title in the inline variant", () => {
    const markup = html(
      <Disclosure summary="Registrar abono" variant="inline">
        {body}
      </Disclosure>,
    );
    expect(markup).not.toContain("border");
    expect(markup).toContain("font-medium");
  });

  it("shows a chevron that turns only with its own disclosure", () => {
    // A "Renovar" (action) inside an open service (panel) must stay closed:
    // each chevron follows the <details> whose summary holds it.
    const markup = html(
      <Disclosure summary="Servicio" defaultOpen>
        <Disclosure summary="Renovar" variant="action">
          {body}
        </Disclosure>
        <Disclosure summary="Detalle">{body}</Disclosure>
      </Disclosure>,
    );
    expect(markup.match(/aria-hidden="true"/g)).toHaveLength(3);
    // React escapes the class: `[[open]>summary>&]:rotate-180`.
    expect(
      markup.match(/\[\[open\]&gt;summary&gt;&amp;\]:rotate-180/g),
    ).toHaveLength(3);
    expect(markup).not.toMatch(/(^|[\s"])group-open[:/]/);
  });

  it("can start open", () => {
    expect(
      html(
        <Disclosure summary="Registrar pago" defaultOpen>
          {body}
        </Disclosure>,
      ),
    ).toContain("<details open=");
  });
});

describe("EmptyState and StatusText", () => {
  it("shows the message and an optional action", () => {
    expect(
      html(
        <EmptyState action={<a href="/nuevo">Nuevo cliente</a>}>
          Todavía no hay clientes.
        </EmptyState>,
      ),
    ).toContain(
      '<p>Todavía no hay clientes.</p><a href="/nuevo">Nuevo cliente</a>',
    );
  });

  it("marks only the alert tone", () => {
    expect(
      html(
        <StatusText tone="alert">Venció el 1 de octubre de 2026</StatusText>,
      ),
    ).toBe(
      '<span class="font-medium text-accent">Venció el 1 de octubre de 2026</span>',
    );
    expect(html(<StatusText>Pagado</StatusText>)).toBe("<span>Pagado</span>");
  });
});
