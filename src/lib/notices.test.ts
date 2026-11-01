import { describe, expect, it } from "vitest";

import { noticeText, withNotice } from "@/lib/notices";

describe("noticeText", () => {
  it("shows only known notices", () => {
    expect(noticeText("servicio-agregado")).toBe("Servicio agregado.");
    expect(noticeText(["pago-registrado"])).toBe("Pago registrado.");
    for (const value of [undefined, "", "Hackeado", "toString", "__proto__"]) {
      expect(noticeText(value)).toBeNull();
    }
  });
});

describe("withNotice", () => {
  it("adds the notice, keeping the query of the path", () => {
    expect(withNotice("/admin/clientes/1", "servicio-agregado")).toBe(
      "/admin/clientes/1?aviso=servicio-agregado",
    );
    expect(withNotice("/admin/clientes?pagina=2", "cliente-guardado")).toBe(
      "/admin/clientes?pagina=2&aviso=cliente-guardado",
    );
    expect(withNotice("/admin/clientes/1#pagos", "pago-registrado")).toBe(
      "/admin/clientes/1?aviso=pago-registrado#pagos",
    );
  });
});
