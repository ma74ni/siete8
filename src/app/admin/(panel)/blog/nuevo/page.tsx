import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { PostFields } from "@/components/admin/post-fields";
import { listServiceOptions } from "@/server/admin-blog";
import { savePost } from "@/server/admin-blog-actions";

// Texts from docs/COPY.md §13.

export default async function NewPostPage() {
  const services = await listServiceOptions();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/blog" className="text-small">
          Volver al blog
        </Link>
        <h1 className="text-h2">Nuevo artículo</h1>
        <p>Después de crearlo podrás subir la portada.</p>
      </div>
      <ActionForm action={savePost} submitLabel="Crear artículo">
        <PostFields services={services} />
      </ActionForm>
    </div>
  );
}
