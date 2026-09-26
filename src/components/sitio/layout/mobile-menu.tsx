"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/sitio/button";
import { NAV_LINKS, type MenuCategory } from "@/lib/menu";

type MobileMenuProps = {
  categories: MenuCategory[];
  cta: { label: string; href: string };
};

/**
 * Navigation for small screens: a toggle that opens a panel under the header
 * with the services, the main links and the WhatsApp button. Escape closes it
 * and returns focus to the toggle.
 */
export function MobileMenu({ categories, cta }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Cerrar menú" : "Menú"}
        onClick={() => setOpen((value) => !value)}
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
        className="absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-border bg-bg"
      >
        <nav className="flex flex-col gap-6 px-5 py-6">
          <div className="flex flex-col gap-4">
            <p className="font-medium">Servicios</p>
            <ul className="flex flex-col gap-4">
              {categories.map((category) => (
                <li key={category.slug}>
                  <p className="text-small">{category.name}</p>
                  <ul>
                    {category.services.map((service) => (
                      <li key={service.slug}>
                        <Link
                          href={`/servicios/${service.slug}`}
                          onClick={close}
                          className="flex min-h-11 items-center"
                        >
                          {service.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
          <ul className="flex flex-col border-t border-border pt-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="flex min-h-11 items-center font-medium text-fg no-underline"
                >
                  {link.label}
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
