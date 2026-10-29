import { ActionForm } from "@/components/admin/action-form";
import { PageHeader } from "@/components/admin/page-header";
import { PostFields } from "@/components/admin/post-fields";
import { listServiceOptions } from "@/server/admin-blog";
import { savePost } from "@/server/admin-blog-actions";

// Texts from docs/COPY.md §13.

export default async function NewPostPage() {
  const services = await listServiceOptions();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title="Nuevo artículo"
        back={{ href: "/admin/blog", label: "Volver al blog" }}
        intro="Después de crearlo podrás subir la portada."
      />
      <ActionForm action={savePost} submitLabel="Crear artículo">
        <PostFields services={services} />
      </ActionForm>
    </div>
  );
}
