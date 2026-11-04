import Link from "next/link";

import { cx } from "@/lib/cx";

// Panel templates (E14-02, DESIGN §12.2).

/**
 * Tabs that are routes: each part of a long record (a service's plans,
 * requirements, page) has its own address and loads only its own data. The
 * page says which tab is current; no script in the browser.
 */
export function SectionTabs({
  label,
  tabs,
  current,
}: {
  label: string;
  tabs: readonly { label: string; href: string }[];
  /** The label of the tab being viewed. */
  current: string;
}) {
  return (
    // Tabs wrap to a second line on a phone instead of hiding behind a
    // scroll, and nothing clips their focus outline.
    <nav aria-label={label} className="border-b border-border">
      <ul className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link
              href={tab.href}
              aria-current={tab.label === current ? "page" : undefined}
              className={cx(
                "flex min-h-11 items-center border-b-4 border-transparent px-3 font-medium whitespace-nowrap text-fg no-underline hover:bg-surface",
                "aria-[current=page]:border-accent",
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
