import type { Metadata } from "next";

import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";
import { ProjectList } from "@/components/sitio/project-list";
import { pageMetadata } from "@/lib/metadata";
import { getPublishedProjects } from "@/server/portfolio";

// Texts from docs/COPY.md §14.

const title = "Proyectos | Siete8";
const description =
  "Sitios web, sistemas y proyectos de inteligencia de negocio que Siete8 hizo para empresas del Ecuador.";

export const metadata: Metadata = pageMetadata({
  title,
  description,
  path: "/proyectos",
});

/** Portfolio with a filter by service (RF-PUB-09). */
export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <>
      {/* One paper floor: the cards' mist frames need the contrast. */}
      <Floor>
        <div className="flex flex-col gap-12">
          <div className="flex max-w-[68ch] flex-col gap-6">
            <h1>Proyectos</h1>
            <p>
              Sitios web, sistemas y proyectos de inteligencia de negocio que
              hicimos para empresas del Ecuador.
            </p>
          </div>
          {projects.length > 0 ? (
            <ProjectList projects={projects} />
          ) : (
            <p>Pronto publicaremos nuestros proyectos.</p>
          )}
        </div>
      </Floor>
      <Closing />
    </>
  );
}
