import { describe, expect, it } from "vitest";

import { fitWithin, webpName } from "@/lib/image-resize";

describe("fitWithin", () => {
  it("shrinks the longest side to the limit and keeps the proportion", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 2400, height: 1800 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1800, height: 2400 });
  });

  it("never enlarges a small image", () => {
    expect(fitWithin(1200, 630)).toEqual({ width: 1200, height: 630 });
  });
});

describe("webpName", () => {
  it("swaps the extension", () => {
    expect(webpName("foto de portada.JPEG")).toBe("foto de portada.webp");
    expect(webpName("captura")).toBe("captura.webp");
    expect(webpName(".png")).toBe("imagen.webp");
  });
});
