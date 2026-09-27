import type { ComponentProps, ReactNode } from "react";

import { cx } from "@/lib/cx";

/**
 * A full-width "rack unit" (DESIGN §2, §5): alternates `paper` and `mist`,
 * with 64 px of vertical space on mobile and 120 px on desktop.
 */
export function Floor({
  alt,
  fitScreen,
  className,
  children,
  ...props
}: {
  /** `mist` floor instead of `paper`. */
  alt?: boolean;
  /**
   * First section of a page: tighter spacing on phones, and on desktop it
   * fills the first screen under the 72 px header with the content centered.
   */
  fitScreen?: boolean;
  className?: string;
  children: ReactNode;
} & ComponentProps<"section">) {
  return (
    <section {...props} className={alt ? "bg-surface" : "bg-bg"}>
      <div
        className={cx(
          "mx-auto max-w-[1200px] px-5 lg:px-12",
          fitScreen
            ? "py-10 lg:flex lg:min-h-[calc(100svh-4.5rem)] lg:items-center lg:py-12"
            : "py-16 lg:py-[120px]",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}
