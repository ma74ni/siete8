/**
 * Geometry of the logo symbol (DESIGN §2, §6), taken from the vector file
 * docs/brand/logo.ai. The PDF coordinates below are copied verbatim from its
 * content stream (points, y up); everything else is derived, so the motif is
 * only ever scaled uniformly, never redrawn by eye.
 *
 * - 7 = 111: three bars sheared along a 30° line (tan 30° = 0.577).
 * - 8 = 1000: one solid module over three hollow modules.
 */

type Point = readonly [number, number];

/** Bottom-right corner of each bar, in PDF coordinates (vino, granate, carmín). */
const PDF_BAR_ORIGINS: readonly Point[] = [
  [176.8037, 184.4939],
  [195.4741, 173.7146],
  [214.2573, 162.8704],
];
/** Bar outline relative to its origin: right-bottom, left-bottom, left-top, right-top. */
const PDF_BAR_SHAPE: readonly Point[] = [
  [0, 0],
  [-14.305, 8.259],
  [-14.305, 122.696],
  [0, 114.438],
];

const PDF_RACK_LEFT = 218.735;
const PDF_RACK_RIGHT = 279.448;
const PDF_HOLE_LEFT = 226.324;
const PDF_HOLE_WIDTH = 45.536;
/** Solid module: bottom and top. */
const PDF_SOLID: readonly [number, number] = [264.805, 274.722];
/** Hollow modules, top to bottom: outer bottom, outer top, hole bottom, hole top. */
const PDF_HOLLOW: readonly (readonly [number, number, number, number])[] = [
  [229.965, 259.717, 239.883, 249.799],
  [195.125, 224.877, 205.044, 214.96],
  [160.285, 190.037, 170.203, 180.12],
];

// SVG space: origin at the top-left of the symbol, y down.
const LEFT = PDF_BAR_ORIGINS[0]![0] + PDF_BAR_SHAPE[1]![0];
const TOP = PDF_BAR_ORIGINS[0]![1] + PDF_BAR_SHAPE[2]![1];
const BOTTOM = PDF_HOLLOW[2]![0];

const round = (n: number) => Math.round(n * 1000) / 1000;
const x = (pdfX: number) => round(pdfX - LEFT);
const y = (pdfY: number) => round(TOP - pdfY);

export type Rect = { x: number; y: number; width: number; height: number };

export const MOTIF_WIDTH = round(PDF_RACK_RIGHT - LEFT);
export const MOTIF_HEIGHT = round(TOP - BOTTOM);

/** The three bars (111) as SVG polygon points, left to right. */
export const BARS: readonly string[] = PDF_BAR_ORIGINS.map(([ox, oy]) =>
  PDF_BAR_SHAPE.map(([dx, dy]) => `${x(ox + dx)},${y(oy + dy)}`).join(" "),
);

export const RACK_LEFT = x(PDF_RACK_LEFT);
export const RACK_WIDTH = round(PDF_RACK_RIGHT - PDF_RACK_LEFT);

/** The solid module (the 1 of 1000). */
export const SOLID_MODULE: Rect = {
  x: RACK_LEFT,
  y: y(PDF_SOLID[1]),
  width: RACK_WIDTH,
  height: round(PDF_SOLID[1] - PDF_SOLID[0]),
};

/** The three hollow modules (the 000), top to bottom, with their holes. */
export const HOLLOW_MODULES: readonly { outer: Rect; hole: Rect }[] =
  PDF_HOLLOW.map(([outerBottom, outerTop, holeBottom, holeTop]) => ({
    outer: {
      x: RACK_LEFT,
      y: y(outerTop),
      width: RACK_WIDTH,
      height: round(outerTop - outerBottom),
    },
    hole: {
      x: x(PDF_HOLE_LEFT),
      y: y(holeTop),
      width: PDF_HOLE_WIDTH,
      height: round(holeTop - holeBottom),
    },
  }));

/** Bar colors, left to right; the order is part of the brand (DESIGN §6). */
export const BAR_FILLS = ["var(--vino)", "var(--granate)", "var(--carmin)"];

/** Rack gradient, left to right: the "Difuminado" of docs/brand/colores.txt. */
export const RACK_STOPS = [
  "var(--grad-1)",
  "var(--grad-2)",
  "var(--grad-3)",
  "var(--grad-4)",
];

/** SVG path of a hollow module: outer rectangle minus the hole (evenodd). */
export function hollowPath({ outer, hole }: { outer: Rect; hole: Rect }) {
  const rect = (r: Rect) =>
    `M${r.x},${r.y}h${r.width}v${r.height}h${-r.width}z`;
  return `${rect(outer)}${rect(hole)}`;
}
