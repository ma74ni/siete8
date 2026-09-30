import "server-only";

import type { PublishedSections } from "@/lib/menu";
import { createPublicClient } from "@/server/supabase/public";

/**
 * Whether the portfolio and the blog have anything public, so the menu can
 * hide empty sections. RLS already limits anonymous reads to published
 * projects and to posts whose date has arrived.
 */
export async function getPublishedSections(): Promise<PublishedSections> {
  const supabase = createPublicClient();
  const [projects, posts] = await Promise.all([
    supabase
      .from("project")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
    supabase
      .from("post")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .lte("published_at", new Date().toISOString()),
  ]);
  if (projects.error || posts.error) {
    throw new Error(
      `Could not check published sections: ${(projects.error ?? posts.error)!.message}`,
    );
  }
  return { projects: (projects.count ?? 0) > 0, posts: (posts.count ?? 0) > 0 };
}
