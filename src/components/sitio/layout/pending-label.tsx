"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

/**
 * A link's text whose underline turns 2 px from the click until the next
 * page arrives, even while its prefetch is still on the way (DESIGN §7). At
 * the links' 3 px offset it covers their 1 px line instead of adding a second
 * one, so it shows on plain links, menu links and buttons alike. A fixed
 * style, with no animation. Goes inside a `<Link>`.
 *
 * The site has no `loading.tsx` on purpose: a loading boundary sends the page
 * with status 200 before a missing service or post can answer 404.
 */
export function PendingLabel({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span
      data-pending={pending || undefined}
      className={
        pending ? "underline decoration-2 underline-offset-[3px]" : undefined
      }
    >
      {children}
    </span>
  );
}
