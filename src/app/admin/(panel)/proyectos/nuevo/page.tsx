import { ActionForm } from "@/components/admin/action-form";
import { PageHeader } from "@/components/admin/page-header";
import { ProjectFields } from "@/components/admin/project-fields";
import { requireAdmin } from "@/server/auth";
import { saveProject } from "@/server/admin-portfolio-actions";

// Texts from docs/COPY.md §13.

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title="Nuevo proyecto"
        back={{ href: "/admin/proyectos", label: "Volver a proyectos" }}
        intro="Después de crearlo podrás subir la portada y la galería."
      />
      <ActionForm action={saveProject} submitLabel="Crear proyecto">
        <ProjectFields />
      </ActionForm>
    </div>
  );
}
