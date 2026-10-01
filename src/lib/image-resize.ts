/**
 * Sizing rules for images reduced in the browser before upload (E4-04):
 * phone and camera photos usually weigh more than the bucket's 2 MB.
 */

/** Longest side of a reduced image: sharp on wide screens, light to load. */
export const MAX_SIDE = 2400;

/** WebP qualities tried in order until the file fits. */
export const QUALITIES = [0.85, 0.75, 0.65];

/** Width and height that fit `maxSide`, keeping the proportion; never upscaled. */
export function fitWithin(
  width: number,
  height: number,
  maxSide = MAX_SIDE,
): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** "foto.jpeg" → "foto.webp". */
export function webpName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "") || "imagen";
  return `${base}.webp`;
}
