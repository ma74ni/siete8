import Link from "next/link";
import type { ComponentProps } from "react";

type TextLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/**
 * Inline link (DESIGN §7): `accent` with a 1 px underline 3 px below, from the
 * base styles. External links open in the same tab, like internal ones.
 */
export function TextLink(props: TextLinkProps) {
  return <Link {...props} />;
}
