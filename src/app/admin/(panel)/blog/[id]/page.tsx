import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { Section } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { PageHeader } from "@/components/admin/page-header";
import { PostFields } from "@/components/admin/post-fields";
import { isUuid } from "@/lib/admin-forms";
import { formatPostDate } from "@/lib/blog";
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
  // A malformed id is just a missing post; any other error is shown as such.
  if (!isUuid(id)) notFound();
  const post = await getPostForAdmin(id);
  if (!post) notFound();

  const live =
    post.status === "published" &&
    post.published_at !== null &&
    new Date(post.published_at) <= new Date();

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <PageHeader
        title={post.title}
        back={{ href: "/admin/blog", label: "Volver al blog" }}
        intro={
          <>
            {live ? (
              <Link href={`/blog/${post.slug}`}>Ver en el sitio</Link>
            ) : (
              "No aparece en el sitio: es un borrador o está programado."
            )}
            <span className="mt-2 block text-small">
              {post.social_sent_at
                ? `Anunciado en redes el ${formatPostDate(post.social_sent_at)}.`
                : "Se anunciará en redes hasta 15 minutos después de salir publicado."}
            </span>
          </>
        }
      />

      <Section title="Artículo">
        <ActionForm
          resetKey={`${post.updated_at}-${post.serviceId}`}
          action={savePost}
          submitLabel="Guardar artículo"
        >
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
