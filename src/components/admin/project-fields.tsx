import { CheckboxField } from "@/components/admin/checkbox-field";
import { SelectField } from "@/components/admin/fields";
import { FormField } from "@/components/sitio/form-field";
import {
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/project-status";
import type { ProjectForAdmin } from "@/server/admin-portfolio";

// Texts from docs/COPY.md §13.

/** What each status means (SRS 3.7), next to its public label. */
const STATUS_HINTS: Record<ProjectStatus, string> = {
  in_development: "En curso",
  active: "En línea y sigue siendo la versión de Siete8: muestra el enlace",
  internal: "En producción, pero privado (intranet, BI, con login)",
  replaced: "El cliente sigue en línea con un sitio que no es de Siete8",
  archived: "Fuera de línea o terminado",
};

/** Fields of a project, shared by the create and edit forms (E4-06). */
export function ProjectFields({ project }: { project?: ProjectForAdmin }) {
  return (
    <>
      {project && <input type="hidden" name="id" value={project.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Título"
          name="title"
          required
          maxLength={120}
          defaultValue={project?.title}
        />
        <FormField
          label="Dirección"
          name="slug"
          maxLength={80}
          defaultValue={project?.slug}
          hint="Parte final del enlace: /proyectos/banco-de-motos. Vacía: se arma con el título."
        />
      </div>
      <SelectField
        label="Estado"
        id="field-status"
        name="status"
        defaultValue={project?.status ?? "archived"}
      >
        {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map(
          (status) => (
            <option key={status} value={status}>
              {PROJECT_STATUS_LABELS[status]}: {STATUS_HINTS[status]}
            </option>
          ),
        )}
      </SelectField>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          label="Cliente"
          name="client_name"
          maxLength={120}
          defaultValue={project?.client_name ?? ""}
        />
        <FormField
          label="Sector"
          name="sector"
          maxLength={120}
          defaultValue={project?.sector ?? ""}
          hint="Se muestra si no muestras el nombre del cliente. Ej: Seguros"
        />
        <FormField
          label="Año"
          name="year"
          type="number"
          min={2000}
          max={2100}
          defaultValue={project?.year ?? ""}
        />
      </div>
      <CheckboxField
        id="field-show_client_name"
        name="show_client_name"
        label="Mostrar el nombre del cliente (solo si lo autorizó)"
        defaultChecked={project?.show_client_name ?? false}
      />
      <FormField
        label="Resumen"
        name="summary"
        multiline
        maxLength={300}
        defaultValue={project?.summary ?? ""}
        hint="Una o dos frases para la tarjeta."
      />
      {(
        [
          ["challenge_md", "Reto", project?.challenge_md],
          ["solution_md", "Solución", project?.solution_md],
          ["results_md", "Resultado", project?.results_md],
        ] as const
      ).map(([name, label, value]) => (
        <FormField
          key={name}
          label={label}
          name={name}
          multiline
          maxLength={5000}
          defaultValue={value ?? ""}
          hint="Markdown: **negrita**, listas con guion. Vacío: no se muestra."
        />
      ))}
      <FormField
        label="Tecnologías"
        name="tech_stack"
        maxLength={400}
        defaultValue={project?.tech_stack.join(", ") ?? ""}
        hint="Separadas por comas: Laravel, MySQL"
      />
      <FormField
        label="Enlace al sitio"
        name="live_url"
        type="url"
        maxLength={300}
        defaultValue={project?.live_url ?? ""}
        hint="Con https://. Solo se muestra si el estado es En línea."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          label="Orden"
          name="sort_order"
          type="number"
          min={0}
          defaultValue={project?.sort_order ?? 0}
          hint="Menor número, primero"
        />
      </div>
      <div className="flex flex-wrap gap-x-6">
        <CheckboxField
          id="field-published"
          name="published"
          label="Publicado en el sitio"
          defaultChecked={project?.published ?? false}
        />
        <CheckboxField
          id="field-featured"
          name="featured"
          label="Destacado en la portada"
          defaultChecked={project?.featured ?? false}
        />
      </div>
    </>
  );
}
