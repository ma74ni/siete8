"use client";

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { nextTabIndex } from "@/components/sitio/tabs-keyboard";
import { cx } from "@/lib/cx";

export type Tab = { id: string; label: string; content: ReactNode };

type TabsProps = {
  /** Accessible name of the tab list, e.g. "Tipo de firma". */
  label: string;
  tabs: Tab[];
};

/**
 * Accessible tabs (WAI-ARIA tabs pattern, automatic activation): arrows,
 * Home and End move between tabs; Tab moves into the panel. Every panel is in
 * the HTML, so the content is indexed and readable without JavaScript.
 */
export function Tabs({ label, tabs }: TabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent) {
    const next = nextTabIndex(event.key, active, tabs.length);
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex border-b border-border"
      >
        {tabs.map((tab, index) => {
          const selected = index === active;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-controls={`${baseId}-panel-${tab.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={cx(
                "-mb-px min-h-11 border-b-2 px-4 text-body transition-colors duration-150 ease-out",
                selected
                  ? "border-accent font-medium text-fg"
                  : "border-transparent text-fg hover:border-border",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={index !== active}
          className="pt-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
