import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { ClientFields } from "@/components/admin/client-fields";
import { ClientServiceFields } from "@/components/admin/client-service-fields";
import { todayInQuito } from "@/lib/clients";
import { createClient } from "@/server/admin-clients-actions";
import { getClientCatalog } from "@/server/admin-clients";

// Texts from docs/COPY.md §13.

/** New client with its first service in one form (RF-CRM-04). */
export default async function NewClientPage() {
  const catalog = await getClientCatalog();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/clientes" className="text-small">
          Volver a clientes
        </Link>
        <h1 className="text-h2">Nuevo cliente</h1>
      </div>
      <ActionForm action={createClient} submitLabel="Crear cliente">
        <ClientFields />
        <fieldset className="flex flex-col gap-4 border-t border-border pt-6">
          <legend className="sr-only">Primer servicio</legend>
          <h2 className="text-h3">Primer servicio</h2>
          <p>
            Opcional: puedes agregarlo ahora o después, desde la ficha del
            cliente.
          </p>
          <ClientServiceFields
            catalog={catalog}
            today={todayInQuito()}
            optional
          />
        </fieldset>
      </ActionForm>
    </div>
  );
}
