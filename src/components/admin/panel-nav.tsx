"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import { Disclosure } from "@/components/admin/disclosure";
import { navItem } from "@/components/admin/nav-item";
import { ADMIN_NAV, isCurrentSection } from "@/lib/admin-nav";

// Texts from docs/COPY.md §13. The section being viewed is marked (DESIGN §12).

/**
 * Closes the phone "Menú" a link sits in, even when the link is the page being
 * viewed, and leaves the focus on "Menú" instead of on a hidden link. On
 * desktop there is no menu around the links, so nothing happens.
 */
function closeMenu(event: MouseEvent<HTMLAnchorElement>) {
  const menu = event.currentTarget.closest("details");
  if (!menu) return;
  menu.open = false;
  menu.querySelector("summary")?.focus();
}

function NavGroups({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Panel" className="flex flex-col gap-4">
      {ADMIN_NAV.map((group, index) => (
        <div
          key={group.title ?? "hoy"}
          // Each group under a line, with a small title: the groups read as
          // groups, not as one long list of links.
          className={
            index === 0
              ? "flex flex-col gap-1"
              : "flex flex-col gap-1 border-t border-border pt-4"
          }
        >
          {group.title && (
            <p className="px-3 pb-1 text-small text-fg-muted">{group.title}</p>
          )}
          <ul className="flex flex-col gap-1">
            {group.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={
                    isCurrentSection(pathname, link.href) ? "page" : undefined
                  }
                  className={navItem}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * The grouped side bar on desktop and a "Menú" on phones (E14-03), each
 * followed by `account` (Ver el sitio, the email, Cerrar sesión). The menu
 * closes when one of its links is picked.
 */
export function PanelNav({ account }: { account: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <div className="hidden flex-col gap-4 lg:flex">
        <NavGroups pathname={pathname} />
        {account}
      </div>
      <div className="lg:hidden">
        <Disclosure summary="Menú" variant="inline">
          <NavGroups pathname={pathname} />
          {account}
        </Disclosure>
      </div>
    </>
  );
}
