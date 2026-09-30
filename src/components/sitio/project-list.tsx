"use client";

import { useState } from "react";

import { ProjectCard } from "@/components/sitio/project-card";
import { cx } from "@/lib/cx";
import { filterOptions, filterProjects } from "@/lib/portfolio-filter";
import type { PortfolioProject } from "@/lib/portfolio-filter";

// Texts from docs/COPY.md §14.

const chip =
  "min-h-11 rounded-control border-[1.5px] px-4 font-medium transition-colors duration-150 ease-out";

/**
 * Portfolio cards with a filter by service (RF-PUB-09). Every project is in
 * the prerendered HTML; the filter only hides cards on the client.
 */
export function ProjectList({ projects }: { projects: PortfolioProject[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = filterOptions(projects);
  const visible = filterProjects(projects, selected);

  return (
    <div className="flex flex-col gap-10">
      {options.length > 1 && (
        <div
          role="group"
          aria-label="Filtrar por servicio"
          className="flex flex-wrap gap-2"
        >
          {[{ slug: null, name: "Todos" }, ...options].map((option) => {
            const active = selected === option.slug;
            return (
              <button
                key={option.slug ?? "todos"}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(option.slug)}
                className={cx(
                  chip,
                  active
                    ? "border-fg bg-fg text-bg"
                    : "border-border bg-bg text-fg hover:border-fg",
                )}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      )}
      <ul
        className="grid gap-10 md:grid-cols-2 lg:grid-cols-3"
        aria-live="polite"
      >
        {visible.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </div>
  );
}
