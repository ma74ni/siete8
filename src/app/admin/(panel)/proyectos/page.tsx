import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/sitio/button";
import { PROJECT_STATUS_LABELS } from "@/lib/project-status";
import { listProjectsForAdmin } from "@/server/admin-portfolio";

// Texts from docs/COPY.md §13.

/** Every project, published or not (E4-06). */
export default async function ProjectsAdminPage() {
  const projects = await listProjectsForAdmin();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title="Proyectos"
        intro="Solo los publicados aparecen en el sitio."
        actions={<Button href="/admin/proyectos/nuevo">Nuevo proyecto</Button>}
      />
      <DataTable
        rows={projects}
        rowKey={(project) => project.id}
        label="Proyectos"
        empty="Todavía no hay proyectos."
        minWidth="20rem"
        columns={[
          {
            header: "Proyecto",
            rowHeader: true,
            cell: (project) => (
              <Link href={`/admin/proyectos/${project.id}`}>
                {project.title}
              </Link>
            ),
          },
          {
            header: "Estado",
            cell: (project) => (
              <>
                {project.published ? "Publicado" : "Sin publicar"}
                {project.featured && ", destacado"}
                {", "}
                {PROJECT_STATUS_LABELS[project.status]}
                {!project.cover_url && ", sin portada"}
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
