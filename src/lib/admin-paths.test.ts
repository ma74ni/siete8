import { describe, expect, it } from "vitest";

import { adminPaths } from "@/lib/admin-paths";

describe("adminPaths", () => {
  it("builds the record and sub-page addresses", () => {
    expect(adminPaths.client("c1")).toBe("/admin/clientes/c1");
    expect(adminPaths.clientService("c1", "s2")).toBe(
      "/admin/clientes/c1/servicios/s2",
    );
    expect(adminPaths.plan("s1", "p2")).toBe("/admin/servicios/s1/planes/p2");
    expect(adminPaths.acceptProforma("l1", "f2")).toBe(
      "/admin/leads/l1/aceptar/f2",
    );
  });

  it("encodes ids, so one can never add a path of its own", () => {
    expect(adminPaths.client("../x?y")).toBe("/admin/clientes/..%2Fx%3Fy");
  });
});
