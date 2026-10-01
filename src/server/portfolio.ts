import "server-only";

import type { PortfolioProject, ProjectCardData } from "@/lib/portfolio-filter";
import { createPublicClient } from "@/server/supabase/public";

/** Published, featured projects for the home page (RF-PUB-14), panel order. */
export async function getFeaturedProjects(
  limit = 3,
): Promise<ProjectCardData[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("project")
    .select("slug, title, summary, status, cover_url")
    .eq("published", true)
    .eq("featured", true)
    .order("sort_order")
    .limit(limit);

  if (error) throw new Error(`Could not load projects: ${error.message}`);

  return data.map(({ cover_url, ...project }) => ({
    ...project,
    coverUrl: cover_url,
  }));
}

/**
 * Published projects for /proyectos (RF-PUB-09), panel order, with their
 * services for the filter. RLS hides unpublished projects and, through the
 * service policy, hidden services.
 */
export async function getPublishedProjects(): Promise<PortfolioProject[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("project")
    .select(
      "slug, title, summary, status, cover_url, project_service(service(slug, name))",
    )
    .eq("published", true)
    .order("sort_order")
    .order("title");

  if (error) throw new Error(`Could not load projects: ${error.message}`);

  return data.map(({ cover_url, project_service, ...project }) => ({
    ...project,
    coverUrl: cover_url,
    services: project_service.flatMap((link) =>
      link.service ? [link.service] : [],
    ),
  }));
}

/** One published project with its gallery (RF-PUB-12), or null. */
export async function getPublishedProject(slug: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("project")
    .select(
      `slug, title, summary, status, client_name, show_client_name, sector, year,
       challenge_md, solution_md, results_md, tech_stack, cover_url, live_url,
       project_image(url, alt, device, sort_order),
       project_service(service(slug, name))`,
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error)
    throw new Error(`Could not load project ${slug}: ${error.message}`);
  if (!data) return null;

  const { project_image, project_service, ...project } = data;
  return {
    ...project,
    images: [...project_image].sort((a, b) => a.sort_order - b.sort_order),
    services: project_service.flatMap((link) =>
      link.service ? [link.service] : [],
    ),
  };
}

export async function getPublishedProjectSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("project")
    .select("slug")
    .eq("published", true);
  if (error) throw new Error(`Could not list projects: ${error.message}`);
  return data.map((project) => project.slug);
}

/**
 * Published projects linked to a service, for its page (E6-02). The inner
 * join keeps only projects that have the service.
 */
export async function getProjectsForService(
  serviceSlug: string,
  limit = 3,
): Promise<ProjectCardData[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("project")
    .select(
      "slug, title, summary, status, cover_url, project_service!inner(service!inner(slug))",
    )
    .eq("published", true)
    .eq("project_service.service.slug", serviceSlug)
    .order("sort_order")
    .limit(limit);

  if (error) {
    throw new Error(
      `Could not load projects of ${serviceSlug}: ${error.message}`,
    );
  }
  return data.map(({ slug, title, summary, status, cover_url }) => ({
    slug,
    title,
    summary,
    status,
    coverUrl: cover_url,
  }));
}
