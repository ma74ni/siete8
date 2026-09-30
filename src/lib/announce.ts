/**
 * Announces new articles on the social networks through a Make webhook.
 * Runs in netlify/functions/announce-posts.mts, outside Next, so it only
 * uses relative imports and gets `fetch` injected (tests pass a fake one).
 */

import { jpegCover } from "./rss";

export type PendingPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  cover_url: string | null;
};

/** What Make receives: one link per network, with its UTM parameters. */
export function announcement(siteUrl: string, post: PendingPost) {
  const url = new URL(`/blog/${post.slug}`, siteUrl).toString();
  const withUtm = (source: string) =>
    `${url}?utm_source=${source}&utm_medium=social&utm_campaign=blog`;
  return {
    title: post.title,
    excerpt: post.excerpt ?? "",
    url,
    url_facebook: withUtm("facebook"),
    url_linkedin: withUtm("linkedin"),
    // Instagram only takes JPEG; empty when the article has no cover.
    image_jpeg: post.cover_url ? jpegCover(siteUrl, post.cover_url) : "",
    published_at: post.published_at,
  };
}

type Env = {
  supabaseUrl: string;
  secretKey: string;
  webhookUrl: string;
  siteUrl: string;
};

/**
 * Sends every published article whose date has passed and that was never
 * announced, oldest first, and marks it. A failed webhook call leaves the
 * article unmarked, so the next run retries it.
 */
export async function announcePending(
  env: Env,
  fetchImpl: typeof fetch = fetch,
  now = new Date(),
): Promise<{ sent: string[]; failed: string[] }> {
  const headers = {
    apikey: env.secretKey,
    Authorization: `Bearer ${env.secretKey}`,
    "Content-Type": "application/json",
  };
  const query = new URL("/rest/v1/post", env.supabaseUrl);
  query.searchParams.set(
    "select",
    "id,slug,title,excerpt,published_at,cover_url",
  );
  query.searchParams.set("status", "eq.published");
  query.searchParams.set("published_at", `lte.${now.toISOString()}`);
  query.searchParams.set("social_sent_at", "is.null");
  query.searchParams.set("order", "published_at.asc");
  query.searchParams.set("limit", "5");

  const response = await fetchImpl(query, { headers });
  if (!response.ok) {
    throw new Error(`Could not read pending posts: HTTP ${response.status}`);
  }
  const posts = (await response.json()) as PendingPost[];

  const sent: string[] = [];
  const failed: string[] = [];
  for (const post of posts) {
    const hook = await fetchImpl(env.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(announcement(env.siteUrl, post)),
    }).catch(() => null);
    if (!hook?.ok) {
      failed.push(post.slug);
      continue;
    }
    // Only if still unmarked: two overlapping runs never announce twice.
    const mark = new URL("/rest/v1/post", env.supabaseUrl);
    mark.searchParams.set("id", `eq.${post.id}`);
    mark.searchParams.set("social_sent_at", "is.null");
    const marked = await fetchImpl(mark, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ social_sent_at: now.toISOString() }),
    });
    if (!marked.ok) {
      throw new Error(
        `Announced ${post.slug} but could not mark it: HTTP ${marked.status}`,
      );
    }
    sent.push(post.slug);
  }
  return { sent, failed };
}
