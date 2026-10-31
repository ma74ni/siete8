"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import { keepOnPage } from "@/lib/menu";

/**
 * Open state of a header menu that belongs to the page it was opened on: a
 * link to another page leaves it open, with the link marked as loading, until
 * that page arrives; then it closes and stays closed.
 */
export function usePageMenu() {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const kept = keepOnPage(openOn, pathname);
  // Adjusting state while rendering, when the page changed (React's pattern
  // for state that depends on a changing value).
  if (kept !== openOn) setOpenOn(kept);
  const close = useCallback(() => setOpenOn(null), []);
  return {
    open: kept !== null,
    pathname,
    setOpen: (value: boolean) => setOpenOn(value ? pathname : null),
    close,
  };
}
