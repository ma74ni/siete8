import { clientEnv } from "@/env/client";
import { buildFeed } from "@/lib/rss";
import { getPublishedPosts } from "@/server/blog";

// Regenerated every 5 minutes (and on every panel save), so an article
// scheduled for 09:00 reaches the feed, and Make, a few minutes after.
export const revalidate = 300;

/** RSS 2.0 of the latest published articles, for Make (social networks). */
export async function GET() {
  const { posts } = await getPublishedPosts(1, 20);
  const xml = buildFeed(
    clientEnv.NEXT_PUBLIC_SITE_URL,
    posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      coverUrl: post.coverUrl,
    })),
  );
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
