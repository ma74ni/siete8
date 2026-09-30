import Image from "next/image";
import Link from "next/link";

import { formatPostDate, pageCount } from "@/lib/blog";
import type { PostListItem } from "@/server/blog";

// Texts from docs/COPY.md §15.

function pageHref(page: number) {
  return page === 1 ? "/blog" : `/blog/pagina/${page}`;
}

/** Article cards and the links between pages (RF-BLG-01). */
export function PostList({
  posts,
  page,
  total,
}: {
  posts: PostListItem[];
  page: number;
  total: number;
}) {
  const pages = pageCount(total);

  return (
    <div className="flex flex-col gap-12">
      <ul className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <article className="flex flex-col gap-3">
              <div className="relative aspect-[1200/630] bg-mist">
                {post.coverUrl && (
                  <Image
                    src={post.coverUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 368px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="text-small">
                <time dateTime={post.publishedAt}>
                  {formatPostDate(post.publishedAt)}
                </time>
              </p>
              <h2 className="text-h4">
                <Link href={`/blog/${post.slug}`} className="text-fg">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && <p>{post.excerpt}</p>}
            </article>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav aria-label="Páginas del blog" className="flex flex-wrap gap-6">
          {page > 1 && (
            <Link href={pageHref(page - 1)}>Artículos más recientes</Link>
          )}
          {page < pages && (
            <Link href={pageHref(page + 1)}>Artículos anteriores</Link>
          )}
        </nav>
      )}
    </div>
  );
}
