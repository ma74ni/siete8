import type { ComponentProps, ReactNode } from "react";

import { cx } from "@/lib/cx";

/**
 * A full-width "rack unit" (DESIGN §2, §5): alternates `paper` and `mist`,
 * with 64 px of vertical space on mobile and 120 px on desktop.
 */
export function Floor({
  alt,
  className,
  children,
  ...props
}: {
  /** `mist` floor instead of `paper`. */
  alt?: boolean;
  className?: string;
  children: ReactNode;
} & ComponentProps<"section">) {
  return (
    <section {...props} className={alt ? "bg-surface" : "bg-bg"}>
      <div
        className={cx(
          "mx-auto max-w-[1200px] px-5 py-16 lg:px-12 lg:py-[120px]",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}
