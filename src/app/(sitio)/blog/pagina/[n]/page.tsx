import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";
import { PostList } from "@/components/sitio/post-list";
import { pageCount, POSTS_PER_PAGE } from "@/lib/blog";
import { pageMetadata } from "@/lib/metadata";
import { getPublishedPosts } from "@/server/blog";

// Texts from docs/COPY.md §15.

/** Page 2 onwards; page 1 lives at /blog. */
function pageNumber(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 2 && String(n) === value ? n : null;
}

export async function generateStaticParams() {
  const { total } = await getPublishedPosts(1, 1);
  return Array.from({ length: pageCount(total) - 1 }, (_, i) => ({
    n: String(i + 2),
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/pagina/[n]">): Promise<Metadata> {
  const { n } = await params;
  const page = pageNumber(n);
  if (!page) return {};
  return pageMetadata({
    title: `Blog, página ${page} | Siete8`,
    path: `/blog/pagina/${page}`,
  });
}

export default async function BlogPageN({
  params,
}: PageProps<"/blog/pagina/[n]">) {
  const { n } = await params;
  const page = pageNumber(n);
  if (!page) notFound();
  const { posts, total } = await getPublishedPosts(page, POSTS_PER_PAGE);
  if (posts.length === 0) notFound();

  return (
    <>
      <Floor>
        <div className="flex flex-col gap-12">
          <h1>Blog</h1>
          <PostList posts={posts} page={page} total={total} />
        </div>
      </Floor>
      <Closing />
    </>
  );
}
