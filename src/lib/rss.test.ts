import { describe, expect, it } from "vitest";

import { buildFeed, escapeXml, jpegCover } from "@/lib/rss";

const site = "https://siete8.com";
const cover =
  "https://example.supabase.co/storage/v1/object/public/images/posts/a.webp";

describe("buildFeed", () => {
  const feed = buildFeed(site, [
    {
      slug: "firma-electronica-en-ecuador",
      title: "Firma electrónica: qué es & cómo <obtenerla>",
      excerpt: "Tipos, vigencias y requisitos.",
      publishedAt: "2026-09-30T15:00:00.000Z",
      coverUrl: cover,
    },
    {
      slug: "sin-portada",
      title: "Sin portada",
      excerpt: null,
      publishedAt: "2026-09-29T15:00:00.000Z",
      coverUrl: null,
    },
  ]);

  it("lists each article with its link, date and escaped title", () => {
    expect(feed).toContain(
      "<title>Firma electrónica: qué es &amp; cómo &lt;obtenerla&gt;</title>",
    );
    expect(feed).toContain(
      "<link>https://siete8.com/blog/firma-electronica-en-ecuador</link>",
    );
    expect(feed).toContain("<pubDate>Wed, 30 Sep 2026 15:00:00 GMT</pubDate>");
    expect(feed).toContain(
      "<description>Tipos, vigencias y requisitos.</description>",
    );
  });

  it("offers the cover as a JPEG, and nothing for articles without one", () => {
    expect(feed.match(/<enclosure /g)).toHaveLength(1);
    expect(feed).toContain('type="image/jpeg"');
    expect(feed).toContain("fm=jpg");
  });
});

describe("jpegCover", () => {
  it("goes through Netlify's image CDN as a 1080 px JPEG", () => {
    const url = new URL(jpegCover(site, cover));
    expect(url.pathname).toBe("/.netlify/images");
    expect(url.searchParams.get("url")).toBe(cover);
    expect(url.searchParams.get("fm")).toBe("jpg");
    expect(url.searchParams.get("w")).toBe("1080");
  });
});

describe("escapeXml", () => {
  it("escapes the five XML characters", () => {
    expect(escapeXml(`a & b < c > "d" 'e'`)).toBe(
      "a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;",
    );
  });
});
