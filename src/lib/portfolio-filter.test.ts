import { describe, expect, it } from "vitest";

import { filterOptions, filterProjects } from "@/lib/portfolio-filter";

const web = { slug: "paginas-web", name: "Páginas web" };
const bi = { slug: "analisis-de-datos-bi", name: "Análisis de datos y BI" };
const projects = [
  { title: "A", services: [web] },
  { title: "B", services: [bi, web] },
  { title: "C", services: [] },
];

describe("portfolio filter", () => {
  it("offers each service with projects once", () => {
    expect(filterOptions(projects)).toEqual([web, bi]);
  });

  it("filters by service, or shows everything without one", () => {
    expect(
      filterProjects(projects, "analisis-de-datos-bi").map((p) => p.title),
    ).toEqual(["B"]);
    expect(filterProjects(projects, null)).toHaveLength(3);
  });
});
