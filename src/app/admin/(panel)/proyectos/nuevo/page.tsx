import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { ProjectFields } from "@/components/admin/project-fields";
import { requireAdmin } from "@/server/auth";
import { saveProject } from "@/server/admin-portfolio-actions";

// Texts from docs/COPY.md §13.

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/proyectos" className="text-small">
          Volver a proyectos
        </Link>
        <h1 className="text-h2">Nuevo proyecto</h1>
        <p>Después de crearlo podrás subir la portada y la galería.</p>
      </div>
      <ActionForm action={saveProject} submitLabel="Crear proyecto">
        <ProjectFields />
      </ActionForm>
    </div>
  );
}
