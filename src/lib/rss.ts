/**
 * RSS 2.0 feed of the blog, read by Make to post each new article on the
 * social networks. Pure: the route handler passes the data.
 */

export type FeedItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string;
  coverUrl: string | null;
};

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * The cover as a JPEG through Netlify's image CDN: Instagram only accepts
 * JPEG, and covers are usually WebP. 1080 px wide, the size Instagram uses.
 */
export function jpegCover(siteUrl: string, coverUrl: string): string {
  const url = new URL("/.netlify/images", siteUrl);
  url.searchParams.set("url", coverUrl);
  url.searchParams.set("w", "1080");
  url.searchParams.set("fm", "jpg");
  url.searchParams.set("q", "85");
  return url.toString();
}

export function buildFeed(siteUrl: string, items: FeedItem[]): string {
  const blog = new URL("/blog", siteUrl).toString();
  const entries = items
    .map((item) => {
      const link = new URL(`/blog/${item.slug}`, siteUrl).toString();
      const image = item.coverUrl ? jpegCover(siteUrl, item.coverUrl) : null;
      return [
        "    <item>",
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>`,
        item.excerpt
          ? `      <description>${escapeXml(item.excerpt)}</description>`
          : null,
        image
          ? `      <enclosure url="${escapeXml(image)}" type="image/jpeg" length="0" />`
          : null,
        image
          ? `      <media:content url="${escapeXml(image)}" medium="image" type="image/jpeg" />`
          : null,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Blog de Siete8</title>
    <link>${escapeXml(blog)}</link>
    <description>Guías cortas sobre firma electrónica, facturación, sitios web y tecnología para negocios en Ecuador.</description>
    <language>es-EC</language>
    <atom:link href="${escapeXml(new URL("/blog/rss.xml", siteUrl).toString())}" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>
`;
}
