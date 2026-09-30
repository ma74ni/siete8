import type { ProjectStatus } from "@/lib/project-status";

export type ProjectCardData = {
  slug: string;
  title: string;
  summary: string | null;
  status: ProjectStatus;
  coverUrl: string | null;
};

export type PortfolioProject = ProjectCardData & {
  services: { slug: string; name: string }[];
};

/** Services that have at least one project, in first-seen order (RF-PUB-09). */
export function filterOptions(
  projects: { services: { slug: string; name: string }[] }[],
): { slug: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const project of projects) {
    for (const service of project.services) {
      if (!seen.has(service.slug)) seen.set(service.slug, service.name);
    }
  }
  return [...seen].map(([slug, name]) => ({ slug, name }));
}

/** Projects of one service, or all of them when `slug` is null. */
export function filterProjects<T extends { services: { slug: string }[] }>(
  projects: T[],
  slug: string | null,
): T[] {
  if (!slug) return projects;
  return projects.filter((project) =>
    project.services.some((service) => service.slug === slug),
  );
}
