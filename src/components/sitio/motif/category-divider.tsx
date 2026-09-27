import { BAR_FILLS, BARS } from "@/components/sitio/motif/motif-geometry";

// The bars alone span 51.759 × 144.32 in logo units; each vertical side is
// 114.437. Sized so that side is 24 px (DESIGN §6), keeping the proportions.
const BARS_WIDTH = 51.759;
const BARS_HEIGHT = 144.32;
const HEIGHT_PX = Math.round((24 * BARS_HEIGHT) / 114.437);

/** Separator next to each category title in the catalog: the three bars. */
export function CategoryDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${BARS_WIDTH} ${BARS_HEIGHT}`}
      height={HEIGHT_PX}
      aria-hidden
      className={className}
      style={{ width: "auto" }}
    >
      {BARS.map((points, index) => (
        <polygon
          key={points}
          points={points}
          style={{ fill: BAR_FILLS[index] }}
        />
      ))}
    </svg>
  );
}
