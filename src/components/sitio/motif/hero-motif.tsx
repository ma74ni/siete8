import { useId } from "react";

import {
  BAR_FILLS,
  BARS,
  HOLLOW_MODULES,
  hollowPath,
  MOTIF_HEIGHT,
  MOTIF_WIDTH,
  RACK_LEFT,
  RACK_STOPS,
  RACK_WIDTH,
  SOLID_MODULE,
  type Rect,
} from "@/components/sitio/motif/motif-geometry";
import styles from "@/components/sitio/motif/motif.module.css";
import { cx } from "@/lib/cx";

// Load sequence (ms): bars light up left to right, then the modules appear
// top to bottom. The last module ends at 890 ms.
const BAR_DELAYS = [0, 135, 270];
const MODULE_DELAYS = [450, 560, 670, 780];

const percent = (value: number, total: number) => `${(value / total) * 100}%`;

function position(rect: Rect) {
  return {
    left: percent(rect.x, MOTIF_WIDTH),
    top: percent(rect.y, MOTIF_HEIGHT),
    width: percent(rect.width, MOTIF_WIDTH),
    height: percent(rect.height, MOTIF_HEIGHT),
  };
}

type HeroMotifProps = {
  /** One label per hollow module, top to bottom (COPY §3). */
  categories: readonly [string, string, string];
  /** Index of the category to stress (a service page shows its own). */
  active?: number;
  /**
   * Without the load animation: only the home hero animates (DESIGN §8,
   * one automatic animation per site).
   */
  still?: boolean;
  className?: string;
};

/**
 * The logo symbol as the hero of the home page (DESIGN §2, §6): three bars
 * (111) and a rack of one solid and three hollow modules (1000), each hollow
 * module holding a service category. Scaled uniformly from the logo geometry.
 * On a narrow motif the categories do not fit inside the modules, so they are
 * listed under it instead.
 */
export function HeroMotif({
  categories,
  active,
  still = false,
  className,
}: HeroMotifProps) {
  const gradientId = `${useId()}-rack`;
  const barClass = still ? undefined : styles.bar;
  const moduleClass = still ? undefined : styles.module;

  return (
    <div className={cx(styles.hero, className)}>
      <div
        className="relative"
        style={{ aspectRatio: `${MOTIF_WIDTH} / ${MOTIF_HEIGHT}` }}
      >
        <svg
          viewBox={`0 0 ${MOTIF_WIDTH} ${MOTIF_HEIGHT}`}
          aria-hidden
          className="absolute inset-0 size-full"
        >
          <defs>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={RACK_LEFT}
              x2={RACK_LEFT + RACK_WIDTH}
              y1="0"
              y2="0"
            >
              {RACK_STOPS.map((color, index) => (
                <stop
                  key={color}
                  offset={index / (RACK_STOPS.length - 1)}
                  style={{ stopColor: color }}
                />
              ))}
            </linearGradient>
          </defs>
          {BARS.map((points, index) => (
            <polygon
              key={points}
              points={points}
              className={barClass}
              style={{
                fill: BAR_FILLS[index],
                animationDelay: `${BAR_DELAYS[index]}ms`,
              }}
            />
          ))}
          <rect
            {...SOLID_MODULE}
            fill={`url(#${gradientId})`}
            className={moduleClass}
            style={{ animationDelay: `${MODULE_DELAYS[0]}ms` }}
          />
          {HOLLOW_MODULES.map((module, index) => (
            <path
              key={module.outer.y}
              d={hollowPath(module)}
              fillRule="evenodd"
              fill={`url(#${gradientId})`}
              className={moduleClass}
              style={{ animationDelay: `${MODULE_DELAYS[index + 1]}ms` }}
            />
          ))}
        </svg>
        <ul className={styles.inside}>
          {HOLLOW_MODULES.map((module, index) => (
            <li
              key={categories[index]}
              className={cx(
                "absolute flex items-center justify-center text-center leading-tight",
                "font-medium",
                // Underlined, not bold: the longest label must still fit.
                index === active &&
                  "underline decoration-action decoration-2 underline-offset-4",
                styles.label,
                moduleClass,
              )}
              aria-current={index === active ? "true" : undefined}
              style={{
                ...position(module.hole),
                animationDelay: `${MODULE_DELAYS[index + 1]}ms`,
              }}
            >
              {categories[index]}
            </li>
          ))}
        </ul>
      </div>
      {/* On desktop the hero must fit the first screen; the categories are
          repeated right below in "Qué resolvemos", so the list is skipped. */}
      <ul
        className={cx(
          "mt-4 flex flex-col gap-2 font-medium lg:hidden",
          styles.below,
        )}
      >
        {categories.map((category) => (
          <li key={category}>{category}</li>
        ))}
      </ul>
    </div>
  );
}
