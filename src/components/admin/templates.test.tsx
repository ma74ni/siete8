import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ActionForm } from "@/components/admin/action-form";
import { DataTable } from "@/components/admin/data-table";
import { FormPage } from "@/components/admin/form-page";
import { Notice } from "@/components/admin/notice";
import { Pagination } from "@/components/admin/pagination";
import { SectionTabs } from "@/components/admin/section-tabs";
import { SubList } from "@/components/admin/sub-list";
import { IDLE } from "@/lib/admin-forms";

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
  // Button links mark themselves while their page loads (PendingLabel).
  useLinkStatus: () => ({ pending: false }),
}));

const html = (node: ReactNode) => renderToStaticMarkup(node);
const rows = [
  { id: "1", name: "Hosting" },
  { id: "2", name: "Firma electrónica" },
];

describe("DataTable (E14-02)", () => {
  it("keeps what is positioned inside its scrolling region", () => {
    const markup = html(
      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        label="Servicios"
        empty="Nada."
        columns={[{ header: "Servicio", cell: (row) => row.name }]}
      />,
    );
    expect(markup).toContain('class="@container relative overflow-x-auto"');
  });

  it("fixes the columns when one has a width, so tables line up", () => {
    const markup = html(
      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        label="Servicios"
        empty="Nada."
        columns={[
          { header: "Servicio", cell: (row) => row.name },
          { header: "Estado", cell: () => "Visible", width: "8rem" },
        ]}
      />,
    );
    expect(markup).toContain("table-fixed");
    expect(markup).toContain('style="width:8rem"');
  });

  it("adds the page links under the table", () => {
    const markup = html(
      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        label="Clientes"
        empty="Nada."
        columns={[{ header: "Cliente", cell: (row) => row.name }]}
        pagination={{
          page: 2,
          pageCount: 3,
          href: (page) => `/c?pagina=${page}`,
        }}
      />,
    );
    expect(markup).toContain('<nav aria-label="Páginas"');
  });
});

describe("Pagination", () => {
  it("shows nothing with a single page", () => {
    expect(html(<Pagination page={1} pageCount={1} href={() => "/"} />)).toBe(
      "",
    );
  });

  it("links the pages around the current one", () => {
    const middle = html(
      <Pagination
        page={2}
        pageCount={3}
        href={(page) => `/c?pagina=${page}`}
      />,
    );
    expect(middle).toContain('href="/c?pagina=1"');
    expect(middle).toContain(">Anteriores<");
    expect(middle).toContain("Página 2 de 3");
    expect(middle).toContain('href="/c?pagina=3"');
    const last = html(
      <Pagination
        page={3}
        pageCount={3}
        href={(page) => `/c?pagina=${page}`}
      />,
    );
    expect(last).not.toContain("Siguientes");
  });
});

describe("SubList", () => {
  it("edits each row on its own page and adds under the table", () => {
    const markup = html(
      <SubList
        rows={rows}
        rowKey={(row) => row.id}
        rowLabel={(row) => row.name}
        editHref={(row) => `/s/${row.id}`}
        label="Planes"
        empty="Todavía no hay planes."
        add={{ href: "/s/nuevo", label: "Agregar plan" }}
        columns={[{ header: "Plan", rowHeader: true, cell: (row) => row.name }]}
      />,
    );
    expect(markup).toContain(
      'href="/s/1" class="inline-flex min-h-11 items-center">Editar<span class="sr-only"> Hosting</span></a>',
    );
    expect(markup).toContain('href="/s/nuevo"');
    expect(markup).toContain("Agregar plan");
    expect(markup).not.toContain("<form");
  });
});

describe("SectionTabs", () => {
  it("marks the current tab, each one a link", () => {
    const markup = html(
      <SectionTabs
        label="Partes del servicio"
        current="Requisitos"
        tabs={[
          { label: "Planes", href: "/s" },
          { label: "Requisitos", href: "/s/requisitos" },
        ]}
      />,
    );
    expect(markup).toContain('<nav aria-label="Partes del servicio"');
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).toMatch(/href="\/s\/requisitos" aria-current="page"/);
  });
});

describe("FormPage and Cancelar", () => {
  it("is one form with Cancelar and the delete action apart", () => {
    const markup = html(
      <FormPage
        title="Agregar servicio"
        back={{ href: "/c/1", label: "Volver a Ana" }}
        danger={<button type="button">Borrar</button>}
      >
        <ActionForm
          action={async () => IDLE}
          submitLabel="Agregar servicio"
          cancelHref="/c/1"
        />
      </FormPage>,
    );
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup.match(/<form/g)).toHaveLength(1);
    expect(markup).toContain(
      '<a href="/c/1" class="inline-flex min-h-12 items-center">Cancelar</a>',
    );
    expect(markup).toMatch(
      /border-t border-border pt-8"><button type="button">Borrar/,
    );
  });
});

describe("Notice", () => {
  it("announces a known notice and nothing else", () => {
    // The live region fills in after mounting, so screen readers read it;
    // the visible box is there from the first paint.
    const known = html(<Notice value="servicio-agregado" />);
    expect(known).toContain('<p role="status" class="sr-only"></p>');
    expect(known).toContain('aria-hidden="true"');
    expect(known).toContain("Servicio agregado.");
    for (const value of ["Te hackearon", undefined]) {
      expect(html(<Notice value={value} />)).not.toContain("hackearon");
      expect(html(<Notice value={value} />)).not.toContain("aria-hidden");
    }
  });
});
