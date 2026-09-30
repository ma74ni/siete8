import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/sitio/button";
import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";
import { JsonLd } from "@/components/sitio/json-ld";
import { Markdown } from "@/components/sitio/markdown";
import { ReadingProgress } from "@/components/sitio/motif/reading-progress";
import { clientEnv } from "@/env/client";
import { formatPostDate, readingMinutes } from "@/lib/blog";
import { pageMetadata } from "@/lib/metadata";
import { articleData } from "@/lib/structured-data";
import { getPublishedPost, getPublishedPostSlugs } from "@/server/blog";

// Texts from docs/COPY.md §15.

export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.seo_title ?? `${post.title} | Siete8`,
    description: post.seo_description ?? post.excerpt ?? undefined,
    path: `/blog/${post.slug}`,
    type: "article",
    // RF-BLG-05: the cover is the preview on social networks and WhatsApp.
    image: post.cover_url ? { url: post.cover_url, alt: post.title } : null,
  });
}

/** One article (RF-BLG-02, 03). Drafts and future dates answer 404. */
export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const author = post.author_name ?? "Siete8";
  const minutes = readingMinutes(post.body_md ?? "");

  return (
    <>
      <ReadingProgress />
      <JsonLd
        data={articleData(clientEnv.NEXT_PUBLIC_SITE_URL, {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          author,
          publishedAt: post.publishedAt,
          updatedAt: post.updated_at,
          coverUrl: post.cover_url,
        })}
      />
      <Floor>
        <article className="flex flex-col gap-10">
          <header className="flex flex-col gap-6">
            <Link href="/blog" className="text-small">
              Volver al blog
            </Link>
            <h1 className="text-h2">{post.title}</h1>
            {post.excerpt && (
              <p className="text-h4 font-normal">{post.excerpt}</p>
            )}
            <p className="text-small">
              Por {author}.{" "}
              <time dateTime={post.publishedAt}>
                {formatPostDate(post.publishedAt)}
              </time>
              . {minutes === 1 ? "1 minuto" : `${minutes} minutos`} de lectura.
            </p>
          </header>
          {post.cover_url && (
            <div className="relative aspect-[1200/630] w-full bg-mist">
              <Image
                src={post.cover_url}
                alt=""
                fill
                priority
                sizes="(min-width: 1200px) 1088px, 100vw"
                className="object-cover"
              />
            </div>
          )}
          {post.body_md && <Markdown>{post.body_md}</Markdown>}
        </article>
      </Floor>
      {post.service && (
        <Floor alt>
          <section className="flex flex-col items-start gap-4">
            <h2 className="text-h3">{post.service.name}</h2>
            <Button href={`/servicios/${post.service.slug}`}>
              Ver planes y requisitos
            </Button>
          </section>
        </Floor>
      )}
      <Closing />
    </>
  );
}
