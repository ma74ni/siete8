import "server-only";

import type { ProjectStatus } from "@/lib/project-status";
import { createPublicClient } from "@/server/supabase/public";

export type ProjectCardData = {
  slug: string;
  title: string;
  summary: string | null;
  status: ProjectStatus;
  coverUrl: string | null;
};

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
