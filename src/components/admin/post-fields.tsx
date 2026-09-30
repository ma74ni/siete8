import { SelectField } from "@/components/admin/fields";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { FormField } from "@/components/sitio/form-field";
import { toQuitoInput } from "@/lib/blog";
import type { PostForAdmin } from "@/server/admin-blog";

// Texts from docs/COPY.md §13.

/** Fields of an article, shared by the create and edit forms (E4-05). */
export function PostFields({
  post,
  services,
}: {
  post?: PostForAdmin;
  services: { id: string; name: string }[];
}) {
  return (
    <>
      {post && <input type="hidden" name="id" value={post.id} />}
      <FormField
        label="Título"
        name="title"
        required
        maxLength={160}
        defaultValue={post?.title}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Dirección"
          name="slug"
          maxLength={80}
          defaultValue={post?.slug}
          hint="Parte final del enlace: /blog/firma-electronica-en-ecuador. Vacía: se arma con el título."
        />
        <FormField
          label="Autor"
          name="author_name"
          maxLength={80}
          defaultValue={post?.author_name ?? ""}
          hint="Vacío: Siete8"
        />
      </div>
      <FormField
        label="Extracto"
        name="excerpt"
        multiline
        maxLength={300}
        defaultValue={post?.excerpt ?? ""}
        hint="Una o dos frases para el listado y la vista previa en redes."
      />
      <MarkdownEditor
        name="body_md"
        label="Artículo"
        defaultValue={post?.body_md ?? ""}
        hint="Markdown: ## Subtítulo, **negrita**, listas con guion, [texto](/servicios/firma-electronica) para enlazar."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField
          label="Estado"
          id="field-status"
          name="status"
          defaultValue={post?.status ?? "draft"}
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
        </SelectField>
        <FormField
          label="Fecha de publicación"
          name="published_at"
          type="datetime-local"
          defaultValue={
            post?.published_at ? toQuitoInput(post.published_at) : ""
          }
          hint="Hora de Quito. Vacía: al publicar. Si es futura, aparece ese día."
        />
        <SelectField
          label="Servicio relacionado"
          id="field-service_id"
          name="service_id"
          defaultValue={post?.serviceId ?? ""}
        >
          <option value="">Ninguno</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </SelectField>
      </div>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-h4">SEO</legend>
        <FormField
          label="Título SEO"
          name="seo_title"
          maxLength={70}
          defaultValue={post?.seo_title ?? ""}
          hint="Hasta 70 caracteres. Vacío: el título."
        />
        <FormField
          label="Descripción SEO"
          name="seo_description"
          multiline
          maxLength={160}
          defaultValue={post?.seo_description ?? ""}
          hint="Hasta 160 caracteres. Vacío: el extracto."
        />
      </fieldset>
    </>
  );
}
