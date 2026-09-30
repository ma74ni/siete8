import Link from "next/link";

import { Button } from "@/components/sitio/button";
import { PROJECT_STATUS_LABELS } from "@/lib/project-status";
import { listProjectsForAdmin } from "@/server/admin-portfolio";

// Texts from docs/COPY.md §13.

/** Every project, published or not (E4-06). */
export default async function ProjectsAdminPage() {
  const projects = await listProjectsForAdmin();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-h2">Proyectos</h1>
          <p>Solo los publicados aparecen en el sitio.</p>
        </div>
        <Button href="/admin/proyectos/nuevo">Nuevo proyecto</Button>
      </div>
      {projects.length === 0 ? (
        <p>Todavía no hay proyectos.</p>
      ) : (
        <ul className="flex flex-col border-t border-border">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3"
            >
              <Link href={`/admin/proyectos/${project.id}`}>
                {project.title}
              </Link>
              <span className="text-small">
                {project.published ? "Publicado" : "Sin publicar"}
                {project.featured && ", destacado"}
                {", "}
                {PROJECT_STATUS_LABELS[project.status]}
                {!project.cover_url && ", sin portada"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
