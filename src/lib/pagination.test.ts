import { describe, expect, it } from "vitest";

import {
  clampPage,
  PAGE_SIZE,
  pageCount,
  pageHref,
  pageNumber,
  pageRange,
} from "@/lib/pagination";

describe("pageNumber", () => {
  it("reads a whole page from the address, 1 otherwise", () => {
    expect(pageNumber("3")).toBe(3);
    expect(pageNumber(["2", "5"])).toBe(2);
    for (const value of [
      undefined,
      "",
      "0",
      "-1",
      "1.5",
      "abc",
      "2abc",
      "1e1",
      " 3",
      "0x10",
      "1e300",
      "99999999999999999999",
    ]) {
      expect(pageNumber(value)).toBe(1);
    }
  });
});

describe("clampPage", () => {
  it("keeps the page within the list", () => {
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(1, 3)).toBe(1);
    expect(clampPage(3, 3)).toBe(3);
    expect(clampPage(99, 3)).toBe(3);
    expect(clampPage(2, 0)).toBe(1);
  });
});

describe("pageCount", () => {
  it("counts pages, with page 1 for an empty list", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(PAGE_SIZE)).toBe(1);
    expect(pageCount(PAGE_SIZE + 1)).toBe(2);
    expect(pageCount(61, 25)).toBe(3);
  });
});

describe("pageRange", () => {
  it("gives the zero-based rows of a page", () => {
    expect(pageRange(1, 25)).toEqual({ from: 0, to: 24 });
    expect(pageRange(3, 25)).toEqual({ from: 50, to: 74 });
    expect(pageRange(0, 25)).toEqual({ from: 0, to: 24 });
  });
});

describe("pageHref", () => {
  it("keeps the filters, drops page 1 and empty values", () => {
    expect(pageHref("/admin/clientes", { q: "ana", pagina: "3" }, 2)).toBe(
      "/admin/clientes?q=ana&pagina=2",
    );
    expect(pageHref("/admin/clientes", { q: "ana", servicio: "" }, 1)).toBe(
      "/admin/clientes?q=ana",
    );
    expect(pageHref("/admin/leads", {}, 1)).toBe("/admin/leads");
  });
});
