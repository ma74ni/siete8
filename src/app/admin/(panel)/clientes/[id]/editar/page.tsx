import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { ClientFields } from "@/components/admin/client-fields";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormPage } from "@/components/admin/form-page";
import { isUuid } from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import { getClientForAdmin } from "@/server/admin-clients";
import { deleteClient, updateClient } from "@/server/admin-clients-actions";

// Texts from docs/COPY.md §13 (Clientes, Editar datos).

/** The client's data on its own page, with "Borrar cliente" apart (E14-04). */
export default async function EditClientPage({
  params,
}: PageProps<"/admin/clientes/[id]/editar">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const client = await getClientForAdmin(id);
  if (!client) notFound();
  const record = adminPaths.client(client.id);

  return (
    <FormPage
      title="Editar datos"
      back={{ href: record, label: `Volver a ${client.name}` }}
      danger={
        <>
          <p className="max-w-[68ch]">
            Borrar el cliente también borra sus servicios y pagos.
          </p>
          <DeleteButton
            action={deleteClient}
            id={client.id}
            label="Borrar cliente"
            question={`¿Borrar a ${client.name}? Se borran también sus servicios y su historial, y no se puede deshacer. Si ya no trabaja contigo, mejor cancela sus servicios.`}
          />
        </>
      }
    >
      <ActionForm
        action={updateClient}
        submitLabel="Guardar cliente"
        cancelHref={record}
      >
        <input type="hidden" name="id" value={client.id} />
        <ClientFields client={client} />
      </ActionForm>
    </FormPage>
  );
}
