import { describe, expect, it } from "vitest";

import { PROJECT_STATUS_LABELS, showsLiveLink } from "./project-status";

describe("project status (SRS 3.7)", () => {
  it("has the public label of every status", () => {
    expect(PROJECT_STATUS_LABELS).toEqual({
      in_development: "Próximamente",
      active: "En línea",
      internal: "Uso interno del cliente",
      replaced: "Versión anterior",
      archived: "Proyecto finalizado",
    });
  });

  it("links to the live site only when active", () => {
    expect(showsLiveLink("active")).toBe(true);
    for (const status of [
      "in_development",
      "internal",
      "replaced",
      "archived",
    ] as const) {
      expect(showsLiveLink(status)).toBe(false);
    }
  });
});
