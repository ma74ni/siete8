import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
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
      <PageHeader
        title="Blog"
        intro="Los borradores y los programados no aparecen en el sitio."
        actions={<Button href="/admin/blog/nuevo">Nuevo artículo</Button>}
      />
      <DataTable
        rows={posts}
        rowKey={(post) => post.id}
        label="Blog"
        empty="Todavía no hay artículos."
        minWidth="20rem"
        columns={[
          {
            header: "Artículo",
            rowHeader: true,
            cell: (post) => (
              <Link href={`/admin/blog/${post.id}`}>{post.title}</Link>
            ),
          },
          {
            header: "Estado",
            cell: (post) => (
              <>
                {state(post)}
                {!post.cover_url && ", sin portada"}
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
