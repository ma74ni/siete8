import { describe, expect, it } from "vitest";

import {
  BAR_FILLS,
  BARS,
  HOLLOW_MODULES,
  MOTIF_HEIGHT,
  MOTIF_WIDTH,
  RACK_STOPS,
  SOLID_MODULE,
} from "./motif-geometry";

const points = (bar: string) =>
  bar.split(" ").map((p) => p.split(",").map(Number) as [number, number]);

describe("motif geometry (docs/brand/logo.ai)", () => {
  it("keeps the proportions of the logo symbol", () => {
    expect(MOTIF_WIDTH).toBeCloseTo(116.949, 2);
    expect(MOTIF_HEIGHT).toBeCloseTo(146.905, 2);
  });

  it("has three bars sheared along a 30° line with equal vertical sides", () => {
    expect(BARS).toHaveLength(3);
    for (const bar of BARS) {
      const [rb, lb, lt, rt] = points(bar) as [
        [number, number],
        [number, number],
        [number, number],
        [number, number],
      ];
      // Vertical sides.
      expect(lb[0]).toBeCloseTo(lt[0], 3);
      expect(rb[0]).toBeCloseTo(rt[0], 3);
      expect(lb[1] - lt[1]).toBeCloseTo(rb[1] - rt[1], 2);
      // Top and bottom edges fall at tan 30° to the right.
      const slope = (rt[1] - lt[1]) / (rt[0] - lt[0]);
      expect(slope).toBeCloseTo(Math.tan(Math.PI / 6), 2);
    }
  });

  it("steps the bars along the same 30° line", () => {
    const tops = BARS.map((bar) => points(bar)[2] as [number, number]);
    for (let i = 1; i < tops.length; i++) {
      const [x0, y0] = tops[i - 1]!;
      const [x1, y1] = tops[i]!;
      expect((y1 - y0) / (x1 - x0)).toBeCloseTo(Math.tan(Math.PI / 6), 2);
    }
  });

  it("stacks one solid module over three hollow ones (1000)", () => {
    expect(HOLLOW_MODULES).toHaveLength(3);
    const gaps = [SOLID_MODULE, ...HOLLOW_MODULES.map((m) => m.outer)]
      .slice(1)
      .map((m, i, all) => {
        const above = i === 0 ? SOLID_MODULE : all[i - 1]!;
        return m.y - (above.y + above.height);
      });
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0]!, 2);
    for (const { outer, hole } of HOLLOW_MODULES) {
      expect(outer.width).toBe(SOLID_MODULE.width);
      // The hole is centered horizontally and as tall as the solid module.
      const left = hole.x - outer.x;
      const right = outer.x + outer.width - (hole.x + hole.width);
      expect(left).toBeCloseTo(right, 2);
      expect(hole.height).toBeCloseTo(SOLID_MODULE.height, 2);
    }
  });

  it("keeps the brand color order", () => {
    expect(BAR_FILLS).toEqual([
      "var(--vino)",
      "var(--granate)",
      "var(--carmin)",
    ]);
    expect(RACK_STOPS).toEqual([
      "var(--grad-1)",
      "var(--grad-2)",
      "var(--grad-3)",
      "var(--grad-4)",
    ]);
  });
});
