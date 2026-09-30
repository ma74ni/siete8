import Link from "next/link";

import { Button } from "@/components/sitio/button";
import { formatPostDate } from "@/lib/blog";
import { listPostsForAdmin } from "@/server/admin-blog";

// Texts from docs/COPY.md §13.

function state(post: { status: string; published_at: string | null }) {
  if (post.status === "draft") return "Borrador";
  if (post.published_at && new Date(post.published_at) > new Date()) {
    return `Programado para el ${formatPostDate(post.published_at)}`;
  }
  return post.published_at
    ? `Publicado el ${formatPostDate(post.published_at)}`
    : "Publicado";
}

/** Every article: drafts, scheduled and published (E4-05). */
export default async function BlogAdminPage() {
  const posts = await listPostsForAdmin();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-h2">Blog</h1>
          <p>Los borradores y los programados no aparecen en el sitio.</p>
        </div>
        <Button href="/admin/blog/nuevo">Nuevo artículo</Button>
      </div>
      {posts.length === 0 ? (
        <p>Todavía no hay artículos.</p>
      ) : (
        <ul className="flex flex-col border-t border-border">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3"
            >
              <Link href={`/admin/blog/${post.id}`}>{post.title}</Link>
              <span className="text-small">
                {state(post)}
                {!post.cover_url && ", sin portada"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
