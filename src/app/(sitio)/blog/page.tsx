import type { Metadata } from "next";

import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";
import { PostList } from "@/components/sitio/post-list";
import { POSTS_PER_PAGE } from "@/lib/blog";
import { pageMetadata } from "@/lib/metadata";
import { getPublishedPosts } from "@/server/blog";

// Texts from docs/COPY.md §15.

const title = "Blog | Siete8";
const description =
  "Guías cortas sobre firma electrónica, facturación, sitios web y tecnología para negocios en Ecuador.";

export const metadata: Metadata = pageMetadata({
  title,
  description,
  path: "/blog",
});

/** First page of the blog (RF-BLG-01). */
export default async function BlogPage() {
  const { posts, total } = await getPublishedPosts(1, POSTS_PER_PAGE);

  return (
    <>
      <Floor>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-6">
            <h1>Blog</h1>
            <p>
              Guías cortas sobre firma electrónica, facturación, sitios web y
              tecnología para negocios en Ecuador.
            </p>
          </div>
          {posts.length > 0 ? (
            <PostList posts={posts} page={1} total={total} />
          ) : (
            <p>Pronto publicaremos el primer artículo.</p>
          )}
        </div>
      </Floor>
      <Closing />
    </>
  );
}
