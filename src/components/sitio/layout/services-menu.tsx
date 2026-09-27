"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { cx } from "@/lib/cx";
import type { MenuCategory } from "@/lib/menu";

/**
 * "Servicios" dropdown for large screens (disclosure pattern): the button
 * toggles the panel; Escape, a click outside or leaving it with the keyboard
 * closes it.
 */
export function ServicesMenu({ categories }: { categories: MenuCategory[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-1 px-3 font-medium"
      >
        Servicios
        <ChevronDown
          aria-hidden
          strokeWidth={1.5}
          className={cx(
            "size-4 transition-transform duration-150 ease-out",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 z-30 mt-2 w-[min(56rem,calc(100vw-6rem))] border border-border bg-bg p-6"
      >
        <ul className="grid grid-cols-2 gap-8 xl:grid-cols-4">
          {categories.map((category) => (
            <li key={category.slug} className="flex flex-col gap-2">
              <p className="font-medium">{category.name}</p>
              {category.description && (
                <p className="text-small">{category.description}</p>
              )}
              <ul className="mt-1 flex flex-col">
                {category.services.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/servicios/${service.slug}`}
                      onClick={() => setOpen(false)}
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
    </div>
  );
}
