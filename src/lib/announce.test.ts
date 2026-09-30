import { describe, expect, it } from "vitest";

import {
  announcement,
  announcePending,
  type PendingPost,
} from "@/lib/announce";

const site = "https://siete8.com";
const post: PendingPost = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "firma-electronica-en-ecuador",
  title: "Firma electrónica en Ecuador",
  excerpt: "Tipos, vigencias y requisitos.",
  published_at: "2026-09-30T15:00:00.000Z",
  cover_url:
    "https://example.supabase.co/storage/v1/object/public/images/posts/a.webp",
};
const env = {
  supabaseUrl: "https://example.supabase.co",
  secretKey: "sb_secret_test",
  webhookUrl: "https://hook.make.com/abc",
  siteUrl: site,
};

describe("announcement", () => {
  it("gives Make one link per network and the cover as JPEG", () => {
    const data = announcement(site, post);
    expect(data.url).toBe(
      "https://siete8.com/blog/firma-electronica-en-ecuador",
    );
    expect(data.url_facebook).toBe(
      `${data.url}?utm_source=facebook&utm_medium=social&utm_campaign=blog`,
    );
    expect(data.url_linkedin).toContain("utm_source=linkedin");
    expect(data.image_jpeg).toContain("fm=jpg");
  });

  it("sends empty strings when there is no excerpt or cover", () => {
    const data = announcement(site, {
      ...post,
      excerpt: null,
      cover_url: null,
    });
    expect(data.excerpt).toBe("");
    expect(data.image_jpeg).toBe("");
  });
});

/** Fake fetch: Supabase answers with `pending`, Make with `hookStatus`. */
function fakeFetch(pending: PendingPost[], hookStatus = 200) {
  const calls: { url: string; method: string; body?: string }[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ url, method, body: init?.body as string | undefined });
    if (url.startsWith(env.webhookUrl)) {
      return new Response(null, { status: hookStatus });
    }
    if (method === "GET") return Response.json(pending);
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  return { impl, calls };
}

describe("announcePending", () => {
  const now = new Date("2026-09-30T15:10:00.000Z");

  it("asks only for published, due and unannounced articles", async () => {
    const { impl, calls } = fakeFetch([]);
    await announcePending(env, impl, now);
    const query = new URL(calls[0]!.url);
    expect(query.searchParams.get("status")).toBe("eq.published");
    expect(query.searchParams.get("published_at")).toBe(
      "lte.2026-09-30T15:10:00.000Z",
    );
    expect(query.searchParams.get("social_sent_at")).toBe("is.null");
  });

  it("sends each article to Make and then marks it", async () => {
    const { impl, calls } = fakeFetch([post]);
    expect(await announcePending(env, impl, now)).toEqual({
      sent: ["firma-electronica-en-ecuador"],
      failed: [],
    });
    expect(calls.map((c) => c.method)).toEqual(["GET", "POST", "PATCH"]);
    expect(JSON.parse(calls[1]!.body!).title).toBe(
      "Firma electrónica en Ecuador",
    );
    const mark = new URL(calls[2]!.url);
    expect(mark.searchParams.get("social_sent_at")).toBe("is.null");
    expect(JSON.parse(calls[2]!.body!)).toEqual({
      social_sent_at: "2026-09-30T15:10:00.000Z",
    });
  });

  it("leaves the article unmarked when Make fails, so it retries", async () => {
    const { impl, calls } = fakeFetch([post], 500);
    expect(await announcePending(env, impl, now)).toEqual({
      sent: [],
      failed: ["firma-electronica-en-ecuador"],
    });
    expect(calls.some((c) => c.method === "PATCH")).toBe(false);
  });
});
