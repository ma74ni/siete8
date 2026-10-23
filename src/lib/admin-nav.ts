/**
 * Whether a panel address belongs to a side bar section. Servicios lives at
 * /admin and its services at /admin/servicios; the other sections own every
 * address under their own.
 */
export function isCurrentSection(pathname: string, href: string): boolean {
  if (href === "/admin")
    return pathname === "/admin" || pathname.startsWith("/admin/servicios/");
  return pathname === href || pathname.startsWith(`${href}/`);
}
