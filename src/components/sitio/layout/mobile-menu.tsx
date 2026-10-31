"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/sitio/button";
import { PendingLabel } from "@/components/sitio/layout/pending-label";
import { usePageMenu } from "@/components/sitio/layout/use-page-menu";
import { cx } from "@/lib/cx";
import { type MenuCategory, type NavLink } from "@/lib/menu";

type MobileMenuProps = {
  categories: MenuCategory[];
  links: NavLink[];
  cta: { label: string; href: string };
};

const navItem =
  "flex min-h-11 w-full items-center font-medium text-fg no-underline";

/**
 * Navigation for small screens: a toggle opens a panel under the header with
 * Servicios (folded until tapped), the main links and the WhatsApp button.
 * Escape closes the panel and returns focus to the toggle. A link to another
 * page keeps the panel open, marked as loading, until that page arrives: the
 * panel belongs to the page it was opened on.
 */
export function MobileMenu({ categories, links, cta }: MobileMenuProps) {
  const { open, pathname, setOpen, close: closePanel } = usePageMenu();
  const [servicesOpen, setServicesOpen] = useState(false);
  const panelId = useId();
  const servicesId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
        setServicesOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closePanel]);

  const close = () => {
    closePanel();
    setServicesOpen(false);
  };
  // A link to the page already open does not navigate, so it closes the panel.
  const closeOnSamePage = (href: string) => () => {
    if (href === pathname) close();
  };

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Cerrar menú" : "Menú"}
        onClick={() => {
          if (open) return close();
          setServicesOpen(false);
          setOpen(true);
        }}
        className="flex size-11 items-center justify-center"
      >
        {open ? (
          <X aria-hidden strokeWidth={1.5} className="size-6" />
        ) : (
          <Menu aria-hidden strokeWidth={1.5} className="size-6" />
        )}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-4.5rem-1px)] overflow-y-auto border-b border-border bg-bg"
      >
        <nav className="flex flex-col gap-6 px-5 pt-2 pb-6">
          <ul className="flex flex-col divide-y divide-border">
            <li>
              <button
                type="button"
                aria-expanded={servicesOpen}
                aria-controls={servicesId}
                onClick={() => setServicesOpen((value) => !value)}
                className={cx(navItem, "justify-between")}
              >
                Servicios
                <ChevronDown
                  aria-hidden
                  strokeWidth={1.5}
                  className={cx(
                    "size-5 transition-transform duration-150 ease-out",
                    servicesOpen && "rotate-180",
                  )}
                />
              </button>
              <ul
                id={servicesId}
                hidden={!servicesOpen}
                className="flex flex-col gap-2 pb-4"
              >
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/servicios#${category.slug}`}
                      onClick={close}
                      className="flex min-h-11 items-center text-small font-medium text-fg-muted no-underline"
                    >
                      {category.name}
                    </Link>
                    <ul>
                      {category.services.map((service) => (
                        <li key={service.slug}>
                          <Link
                            href={`/servicios/${service.slug}`}
                            onClick={closeOnSamePage(
                              `/servicios/${service.slug}`,
                            )}
                            className="flex min-h-11 items-center pl-4 text-fg no-underline"
                          >
                            <PendingLabel>{service.name}</PendingLabel>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeOnSamePage(link.href)}
                  className={navItem}
                >
                  <PendingLabel>{link.label}</PendingLabel>
                </Link>
              </li>
            ))}
          </ul>
          <Button href={cta.href} onClick={close} className="w-full">
            {cta.label}
          </Button>
        </nav>
      </div>
    </>
  );
}
