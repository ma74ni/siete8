import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { CheckboxField } from "@/components/admin/checkbox-field";
import { DeleteButton } from "@/components/admin/delete-button";
import { Section, SelectField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { ProjectFields } from "@/components/admin/project-fields";
import { FormField } from "@/components/sitio/form-field";
import { isUuid } from "@/lib/admin-forms";
import { getProjectForAdmin } from "@/server/admin-portfolio";
import {
  addProjectImage,
  deleteProject,
  deleteProjectImage,
  saveProject,
  saveProjectCover,
  saveProjectServices,
} from "@/server/admin-portfolio-actions";

// Texts from docs/COPY.md §13.

/** Edit a project: data, cover, gallery and services (E4-04, E4-06). */
export default async function EditProjectPage({
  params,
}: PageProps<"/admin/proyectos/[id]">) {
  const { id } = await params;
  // A malformed id is just a missing project; any other error is shown as such.
  if (!isUuid(id)) notFound();
  const project = await getProjectForAdmin(id);
  if (!project) notFound();

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link href="/admin/proyectos" className="text-small">
          Volver a proyectos
        </Link>
        <h1 className="text-h2">{project.title}</h1>
        <p>
          {project.published ? (
            <Link href={`/proyectos/${project.slug}`}>Ver en el sitio</Link>
          ) : (
            "Sin publicar: no aparece en el sitio."
          )}
        </p>
      </div>

      <Section title="Datos del proyecto">
        <ActionForm
          resetKey={project.updated_at}
          action={saveProject}
          submitLabel="Guardar proyecto"
        >
          <ProjectFields project={project} />
        </ActionForm>
      </Section>

      <Section title="Portada">
        <p className="max-w-[68ch]">
          Se ve en las tarjetas y arriba de la página del proyecto, en
          proporción 16:10.
        </p>
        {project.cover_url && (
          <div className="relative aspect-[16/10] w-full max-w-[24rem] bg-surface">
            <Image
              src={project.cover_url}
              alt="Portada actual"
              fill
              sizes="24rem"
              className="object-cover"
            />
          </div>
        )}
        <ActionForm
          action={saveProjectCover}
          submitLabel={project.cover_url ? "Cambiar portada" : "Subir portada"}
          pendingLabel="Subiendo…"
        >
          <input type="hidden" name="project_id" value={project.id} />
          <ImageField label="Imagen" id="cover-file" />
        </ActionForm>
      </Section>

      <Section title="Galería">
        {project.project_image.length === 0 && <p>Todavía no hay capturas.</p>}
        <ul className="grid gap-6 md:grid-cols-2">
          {project.project_image.map((image) => (
            <li key={image.id} className="flex flex-col gap-3">
              <div className="relative aspect-[16/10] bg-surface">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 768px) 30rem, 100vw"
                  className="object-contain"
                />
              </div>
              <p className="text-small">
                {image.device === "mobile" ? "Celular" : "Escritorio"}, orden{" "}
                {image.sort_order}. Texto alternativo: {image.alt}
              </p>
              <DeleteButton
                action={deleteProjectImage}
                id={image.id}
                label="Borrar imagen"
                question="¿Borrar esta imagen? No se puede deshacer."
              />
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-4 rounded-control border border-border p-5">
          <h3 className="text-h4">Agregar una captura</h3>
          <ActionForm
            action={addProjectImage}
            submitLabel="Agregar imagen"
            pendingLabel="Subiendo…"
            variant="secondary"
          >
            <input type="hidden" name="project_id" value={project.id} />
            <ImageField label="Imagen" id="gallery-file" />
            <FormField
              label="Texto alternativo"
              name="alt"
              required
              maxLength={200}
              hint="Describe lo que se ve, para quien no puede ver la imagen. Ej: Portada del sitio con el catálogo de motos."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Dispositivo"
                id="field-device"
                name="device"
                defaultValue="desktop"
              >
                <option value="desktop">Escritorio</option>
                <option value="mobile">Celular</option>
              </SelectField>
              <FormField
                label="Orden"
                name="sort_order"
                type="number"
                min={0}
                defaultValue={project.project_image.length + 1}
              />
            </div>
          </ActionForm>
        </div>
      </Section>

      <Section title="Servicios relacionados">
        <p className="max-w-[68ch]">
          Sirven para filtrar el portafolio y para enlazar al servicio desde la
          página del proyecto.
        </p>
        <ActionForm
          resetKey={project.serviceIds.join()}
          action={saveProjectServices}
          submitLabel="Guardar servicios"
        >
          <input type="hidden" name="project_id" value={project.id} />
          <fieldset className="grid gap-x-6 md:grid-cols-2">
            <legend className="sr-only">Servicios</legend>
            {project.allServices.map((service) => (
              <CheckboxField
                key={service.id}
                id={`service-${service.id}`}
                name="service_ids"
                value={service.id}
                label={service.name}
                defaultChecked={project.serviceIds.includes(service.id)}
              />
            ))}
          </fieldset>
        </ActionForm>
      </Section>

      <Section title="Borrar el proyecto">
        <DeleteButton
          action={deleteProject}
          id={project.id}
          label="Borrar proyecto"
          question={`¿Borrar ${project.title}? Se borran también sus imágenes y no se puede deshacer.`}
        />
      </Section>
    </div>
  );
}
