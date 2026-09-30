import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/sitio/button";
import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";
import { Markdown } from "@/components/sitio/markdown";
import { pageMetadata } from "@/lib/metadata";
import { PROJECT_STATUS_LABELS, showsLiveLink } from "@/lib/project-status";
import {
  getPublishedProject,
  getPublishedProjectSlugs,
} from "@/server/portfolio";

// Texts from docs/COPY.md §14.

export async function generateStaticParams() {
  const slugs = await getPublishedProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/proyectos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return {};
  return pageMetadata({
    title: `${project.title} | Proyectos de Siete8`,
    description: project.summary ?? undefined,
    path: `/proyectos/${project.slug}`,
    image: project.cover_url
      ? { url: project.cover_url, alt: project.title }
      : null,
  });
}

/** One project (RF-PUB-12): only "En línea" projects link out (SRS 3.7). */
export default async function ProjectPage({
  params,
}: PageProps<"/proyectos/[slug]">) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  const who = project.show_client_name
    ? { label: "Cliente", value: project.client_name }
    : { label: "Sector", value: project.sector };
  const facts = [
    who,
    project.year && { label: "Año", value: String(project.year) },
    { label: "Estado", value: PROJECT_STATUS_LABELS[project.status] },
  ].filter((fact): fact is { label: string; value: string } =>
    Boolean(fact && fact.value),
  );
  const story = [
    { title: "Reto", body: project.challenge_md },
    { title: "Solución", body: project.solution_md },
    { title: "Resultado", body: project.results_md },
  ].filter((part): part is { title: string; body: string } =>
    Boolean(part.body),
  );
  const liveUrl =
    showsLiveLink(project.status) && project.live_url ? project.live_url : null;

  return (
    <>
      <Floor>
        <div className="flex flex-col gap-10">
          <div className="flex max-w-[68ch] flex-col gap-6">
            <Link href="/proyectos" className="text-small">
              Volver a proyectos
            </Link>
            <h1>{project.title}</h1>
            {project.summary && <p>{project.summary}</p>}
            <dl className="flex flex-wrap gap-x-10 gap-y-4">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col">
                  <dt className="text-small">{fact.label}</dt>
                  <dd className="font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>
            {liveUrl && (
              <Button href={liveUrl} variant="secondary" className="self-start">
                Ver el sitio
              </Button>
            )}
          </div>
          {project.cover_url && (
            <div className="relative aspect-[16/10] w-full bg-mist">
              <Image
                src={project.cover_url}
                alt=""
                fill
                priority
                sizes="(min-width: 1200px) 1104px, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </Floor>

      {(story.length > 0 || project.tech_stack.length > 0) && (
        <Floor alt>
          <div className="flex flex-col gap-10">
            {story.map((part) => (
              <section key={part.title} className="flex flex-col gap-4">
                <h2 className="text-h3">{part.title}</h2>
                <Markdown>{part.body}</Markdown>
              </section>
            ))}
            {project.tech_stack.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-h3">Tecnologías</h2>
                <ul className="flex flex-wrap gap-x-6 gap-y-2">
                  {project.tech_stack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </Floor>
      )}

      {project.images.length > 0 && (
        <Floor>
          <section className="flex flex-col gap-8">
            <h2>Galería</h2>
            <ul className="grid gap-8 md:grid-cols-2">
              {project.images.map((image) => (
                <li
                  key={image.url}
                  className={
                    image.device === "mobile"
                      ? "mx-auto w-full max-w-[20rem]"
                      : ""
                  }
                >
                  <div
                    className={`relative bg-mist ${image.device === "mobile" ? "aspect-[9/19]" : "aspect-[16/10]"}`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-contain"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Floor>
      )}

      {project.services.length > 0 && (
        <Floor alt>
          <section className="flex flex-col gap-6">
            <h2>Servicio relacionado</h2>
            <ul className="flex flex-col gap-4">
              {project.services.map((service) => (
                <li
                  key={service.slug}
                  className="flex flex-wrap items-center gap-4"
                >
                  <span className="text-h4">{service.name}</span>
                  <Button
                    href={`/servicios/${service.slug}`}
                    variant="secondary"
                  >
                    Ver planes y requisitos
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </Floor>
      )}

      <Closing />
    </>
  );
}
