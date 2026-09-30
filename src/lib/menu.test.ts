import { describe, expect, it } from "vitest";

import { navLinks, visibleCatalog, type CatalogRow } from "./menu";

const service = (
  slug: string,
  sort_order: number,
  visible = true,
): CatalogRow["service"][number] => ({
  name: slug,
  slug,
  summary: null,
  visible,
  sort_order,
});

const category = (
  slug: string,
  sort_order: number,
  services: CatalogRow["service"],
  visible = true,
): CatalogRow => ({
  name: slug,
  slug,
  description: null,
  visible,
  sort_order,
  service: services,
});

describe("visibleCatalog (RF-PUB-02)", () => {
  it("orders categories and services as set in the panel", () => {
    const catalog = visibleCatalog([
      category("tramites", 2, [service("firma", 1)]),
      category("presencia", 1, [service("hosting", 4), service("web", 1)]),
    ]);
    expect(catalog.map((c) => c.slug)).toEqual(["presencia", "tramites"]);
    expect(catalog[0]!.services.map((s) => s.slug)).toEqual(["web", "hosting"]);
  });

  it("leaves out hidden services", () => {
    const catalog = visibleCatalog([
      category("tramites", 1, [
        service("firma", 1),
        service("facturacion", 2, false),
      ]),
    ]);
    expect(catalog[0]!.services.map((s) => s.slug)).toEqual(["firma"]);
  });

  it("leaves out hidden categories, even with visible services", () => {
    const catalog = visibleCatalog([
      category("marketing", 1, [service("mailing", 1)], false),
      category("soporte", 2, [service("soporte-tecnico", 1)]),
    ]);
    expect(catalog.map((c) => c.slug)).toEqual(["soporte"]);
  });

  it("leaves out categories without visible services", () => {
    const catalog = visibleCatalog([
      category("marketing", 1, [service("mailing", 1, false)]),
      category("vacia", 2, []),
    ]);
    expect(catalog).toEqual([]);
  });

  it("keeps the service summary", () => {
    const catalog = visibleCatalog([
      category("tramites", 1, [{ ...service("firma", 1), summary: "Texto" }]),
    ]);
    expect(catalog[0]!.services[0]).toEqual({
      name: "firma",
      slug: "firma",
      summary: "Texto",
    });
  });
});

describe("navLinks", () => {
  it("hides Proyectos and Blog until something is published", () => {
    expect(
      navLinks({ projects: false, posts: false }).map((l) => l.label),
    ).toEqual(["Nosotros", "Contacto"]);
    expect(
      navLinks({ projects: true, posts: true }).map((l) => l.label),
    ).toEqual(["Proyectos", "Blog", "Nosotros", "Contacto"]);
  });
});
