import { describe, expect, it } from "vitest";

import { ADMIN_NAV, isCurrentSection } from "@/lib/admin-nav";
import { adminPaths } from "@/lib/admin-paths";

describe("current panel section", () => {
  it("marks Hoy only on the panel home", () => {
    expect(isCurrentSection("/admin", "/admin")).toBe(true);
    expect(isCurrentSection("/admin/servicios", "/admin")).toBe(false);
    expect(isCurrentSection("/admin/clientes", "/admin")).toBe(false);
  });

  it("marks Servicios on the catalog and on each service", () => {
    expect(isCurrentSection("/admin/servicios", "/admin/servicios")).toBe(true);
    expect(isCurrentSection("/admin/servicios/abc", "/admin/servicios")).toBe(
      true,
    );
  });

  it("marks a section on its own pages", () => {
    expect(isCurrentSection("/admin/clientes", "/admin/clientes")).toBe(true);
    expect(isCurrentSection("/admin/clientes/abc", "/admin/clientes")).toBe(
      true,
    );
    expect(isCurrentSection("/admin/compras/nueva", "/admin/compras")).toBe(
      true,
    );
  });

  it("does not mix sections that share a prefix", () => {
    expect(isCurrentSection("/admin/blogger", "/admin/blog")).toBe(false);
    expect(isCurrentSection("/admin/clientes", "/")).toBe(false);
  });
});

describe("panel navigation", () => {
  const links = ADMIN_NAV.flatMap((group) => group.links);

  it("starts with Hoy, alone and without a title", () => {
    expect(ADMIN_NAV[0]).toEqual({
      links: [{ label: "Hoy", href: adminPaths.home }],
    });
  });

  it("names every other group", () => {
    expect(ADMIN_NAV.slice(1).map((group) => group.title)).toEqual([
      "Ventas",
      "Catálogo",
      "Finanzas",
      "Sitio",
    ]);
  });

  it("links only to panel sections, each once", () => {
    const sections = new Set<string>(
      Object.values(adminPaths).filter((path) => typeof path === "string"),
    );
    for (const link of links) expect(sections).toContain(link.href);
    expect(new Set(links.map((link) => link.href)).size).toBe(links.length);
  });

  it("marks exactly one section on any page of the panel", () => {
    for (const pathname of [
      "/admin",
      "/admin/servicios/abc",
      "/admin/clientes/abc/editar",
      "/admin/asistente/abc",
    ]) {
      const current = links.filter((link) =>
        isCurrentSection(pathname, link.href),
      );
      expect(current).toHaveLength(1);
    }
  });
});
