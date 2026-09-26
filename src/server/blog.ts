import "server-only";

import { createPublicClient } from "@/server/supabase/public";

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
};

/** The most recent published article, or null when there is none yet. */
export async function getLatestPost(): Promise<PostSummary | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("post")
    .select("slug, title, excerpt")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error)
    throw new Error(`Could not load the latest post: ${error.message}`);
  return data;
}
