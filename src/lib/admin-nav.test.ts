import { describe, expect, it } from "vitest";

import { isCurrentSection } from "@/lib/admin-nav";

describe("current panel section", () => {
  it("marks Servicios on the panel home and on each service", () => {
    expect(isCurrentSection("/admin", "/admin")).toBe(true);
    expect(isCurrentSection("/admin/servicios/abc", "/admin")).toBe(true);
    expect(isCurrentSection("/admin/clientes", "/admin")).toBe(false);
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
