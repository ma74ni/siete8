"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { isCurrentSection } from "@/lib/admin-nav";

/** A side bar link that marks the section being viewed (aria-current). */
export function NavLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      aria-current={isCurrentSection(pathname, href) ? "page" : undefined}
      {...props}
    />
  );
}
