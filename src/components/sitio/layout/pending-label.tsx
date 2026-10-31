"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

/**
 * A link's text that stays underlined from the click until the next page
 * arrives, even while its prefetch is still on the way. Goes inside a
 * `<Link>`. The same 1 px line as a hovered link (DESIGN §7), so the two
 * overlap; a fixed style, with no animation. Screen readers hear the loading
 * state from `loading.tsx` instead.
 */
export function PendingLabel({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span
      data-pending={pending || undefined}
      className={
        pending ? "underline decoration-1 underline-offset-[3px]" : undefined
      }
    >
      {children}
    </span>
  );
}
