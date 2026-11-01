import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublishedPosts } from "@/server/blog";

vi.mock("server-only", () => ({}));

/** What the paged query answers in each test. */
type Answer = { data: unknown; error: unknown; count: number | null };
const answer = vi.hoisted((): { current: Answer } => ({
  current: { data: [], error: null, count: 0 },
}));

vi.mock("@/server/supabase/public", () => {
  const query = {
    select: () => query,
    eq: () => query,
    lte: () => query,
    order: () => query,
    range: () => Promise.resolve(answer.current),
  };
  return { createPublicClient: () => ({ from: () => query }) };
});

describe("getPublishedPosts", () => {
  beforeEach(() => {
    answer.current = { data: [], error: null, count: 0 };
  });

  it("returns the page's posts and the total", async () => {
    answer.current = {
      data: [
        {
          slug: "firma",
          title: "Firma",
          excerpt: null,
          published_at: "2026-10-01T15:00:00Z",
          cover_url: null,
        },
      ],
      error: null,
      count: 1,
    };
    expect(await getPublishedPosts(1, 9)).toEqual({
      total: 1,
      posts: [
        {
          slug: "firma",
          title: "Firma",
          excerpt: null,
          publishedAt: "2026-10-01T15:00:00Z",
          coverUrl: null,
        },
      ],
    });
  });

  it("returns no posts for a page after the last one, instead of failing", async () => {
    answer.current = {
      data: null,
      error: { code: "PGRST103", message: "Requested range not satisfiable" },
      count: null,
    };
    expect(await getPublishedPosts(2, 9)).toEqual({ posts: [], total: 0 });
  });

  it("still fails on any other error", async () => {
    answer.current = {
      data: null,
      error: { code: "PGRST301", message: "JWT expired" },
      count: null,
    };
    await expect(getPublishedPosts(1, 9)).rejects.toThrow(
      "Could not list posts: JWT expired",
    );
  });
});
