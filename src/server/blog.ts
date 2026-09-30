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

export type PostListItem = PostSummary & {
  publishedAt: string;
  coverUrl: string | null;
};

// RLS already hides drafts and articles whose date has not come; the filters
// repeat it so the intent is visible here.
const now = () => new Date().toISOString();

/** One page of published articles, newest first (RF-BLG-01). */
export async function getPublishedPosts(
  page: number,
  perPage: number,
): Promise<{ posts: PostListItem[]; total: number }> {
  const supabase = createPublicClient();
  const from = (page - 1) * perPage;
  const { data, error, count } = await supabase
    .from("post")
    .select("slug, title, excerpt, published_at, cover_url", { count: "exact" })
    .eq("status", "published")
    .lte("published_at", now())
    .order("published_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (error) throw new Error(`Could not list posts: ${error.message}`);
  return {
    total: count ?? 0,
    posts: data.map(({ published_at, cover_url, ...post }) => ({
      ...post,
      publishedAt: published_at!,
      coverUrl: cover_url,
    })),
  };
}

/** One published article with its related service (RF-BLG-02, 03). */
export async function getPublishedPost(slug: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("post")
    .select(
      `slug, title, excerpt, body_md, author_name, published_at, updated_at,
       cover_url, seo_title, seo_description, post_service(service(slug, name))`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", now())
    .maybeSingle();

  if (error) throw new Error(`Could not load post ${slug}: ${error.message}`);
  if (!data) return null;
  const { post_service, published_at, ...post } = data;
  return {
    ...post,
    publishedAt: published_at!,
    // Hidden services come back as null (RLS), so no CTA to a 404.
    service: post_service.find((link) => link.service)?.service ?? null,
  };
}

export async function getPublishedPostSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("post")
    .select("slug")
    .eq("status", "published")
    .lte("published_at", now());
  if (error) throw new Error(`Could not list posts: ${error.message}`);
  return data.map((post) => post.slug);
}
