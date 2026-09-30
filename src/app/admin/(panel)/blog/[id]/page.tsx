import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { ImageField, Section } from "@/components/admin/fields";
import { PostFields } from "@/components/admin/post-fields";
import { getPostForAdmin } from "@/server/admin-blog";
import {
  deletePost,
  savePost,
  savePostCover,
} from "@/server/admin-blog-actions";

// Texts from docs/COPY.md §13.

/** Edit an article: text, publication, cover and SEO (E4-05). */
export default async function EditPostPage({
  params,
}: PageProps<"/admin/blog/[id]">) {
  const { id } = await params;
  // A malformed id is just a missing article.
  const post = await getPostForAdmin(id).catch(() => null);
  if (!post) notFound();

  const live =
    post.status === "published" &&
    post.published_at !== null &&
    new Date(post.published_at) <= new Date();

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link href="/admin/blog" className="text-small">
          Volver al blog
        </Link>
        <h1 className="text-h2">{post.title}</h1>
        <p>
          {live ? (
            <Link href={`/blog/${post.slug}`}>Ver en el sitio</Link>
          ) : (
            "No aparece en el sitio: es un borrador o está programado."
          )}
        </p>
      </div>

      <Section title="Artículo">
        <ActionForm action={savePost} submitLabel="Guardar artículo">
          <PostFields post={post} services={post.allServices} />
        </ActionForm>
      </Section>

      <Section title="Portada">
        <p className="max-w-[68ch]">
          Se ve arriba del artículo y al compartirlo en redes y WhatsApp. Usa
          una imagen horizontal, idealmente de 1200 × 630.
        </p>
        {post.cover_url && (
          <div className="relative aspect-[1200/630] w-full max-w-[24rem] bg-surface">
            <Image
              src={post.cover_url}
              alt="Portada actual"
              fill
              sizes="24rem"
              className="object-cover"
            />
          </div>
        )}
        <ActionForm
          action={savePostCover}
          submitLabel={post.cover_url ? "Cambiar portada" : "Subir portada"}
          pendingLabel="Subiendo…"
        >
          <input type="hidden" name="post_id" value={post.id} />
          <ImageField label="Imagen" id="post-cover-file" />
        </ActionForm>
      </Section>

      <Section title="Borrar el artículo">
        <DeleteButton
          action={deletePost}
          id={post.id}
          label="Borrar artículo"
          question={`¿Borrar "${post.title}"? No se puede deshacer.`}
        />
      </Section>
    </div>
  );
}
