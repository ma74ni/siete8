import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { CheckboxField } from "@/components/admin/checkbox-field";
import { DeleteButton } from "@/components/admin/delete-button";
import { SelectField } from "@/components/admin/fields";
import { FormField } from "@/components/sitio/form-field";
import { deleteLinkButton, saveLinkButton } from "@/server/admin-links-actions";
import {
  type LinkButtonForAdmin as LinkButton,
  listLinkButtonsForAdmin,
} from "@/server/admin-links";

// Texts from docs/COPY.md §13.

const KINDS = [
  { value: "url", label: "Enlace" },
  { value: "whatsapp", label: "WhatsApp (número de Configuración)" },
  { value: "latest_post", label: "Último artículo del blog" },
] as const;

function ButtonEditor({ item }: { item?: LinkButton }) {
  const key = item?.id ?? "nuevo";
  return (
    <div className="flex flex-col gap-4 rounded-control border border-border p-5">
      <h2 className="text-h4">
        {item ? item.label : "Agregar un botón"}
        {item && !item.visible && (
          <span className="font-normal"> (oculto)</span>
        )}
      </h2>
      <ActionForm
        action={saveLinkButton}
        submitLabel={item ? "Guardar botón" : "Agregar botón"}
        variant={item ? "primary" : "secondary"}
        resetKey={item?.updated_at}
      >
        {item && <input type="hidden" name="id" value={item.id} />}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Texto"
            name="label"
            id={`label-${key}`}
            required
            maxLength={60}
            defaultValue={item?.label}
            hint="En el último artículo, es el texto pequeño sobre su título."
          />
          <SelectField
            label="Tipo"
            id={`kind-${key}`}
            name="kind"
            defaultValue={item?.kind ?? "url"}
          >
            {KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
          <FormField
            label="Enlace"
            name="url"
            id={`url-${key}`}
            defaultValue={item?.url ?? ""}
            hint="Solo para el tipo Enlace: una página del sitio (/servicios) o una dirección con https://."
          />
          <FormField
            label="Orden"
            name="sort_order"
            id={`order-${key}`}
            type="number"
            min={0}
            defaultValue={item?.sort_order ?? 0}
          />
        </div>
        <div className="flex flex-wrap gap-x-6">
          <CheckboxField
            id={`visible-${key}`}
            name="visible"
            label="Visible"
            defaultChecked={item?.visible ?? true}
          />
          <CheckboxField
            id={`highlight-${key}`}
            name="highlight"
            label="Destacado (botón principal)"
            defaultChecked={item?.highlight ?? false}
          />
        </div>
      </ActionForm>
      {item && (
        <DeleteButton
          action={deleteLinkButton}
          id={item.id}
          label="Borrar botón"
          question={`¿Borrar el botón "${item.label}"? No se puede deshacer.`}
        />
      )}
    </div>
  );
}

/** Buttons of the links page for the social networks' bio. */
export default async function LinksAdminPage() {
  const buttons = await listLinkButtonsForAdmin();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2">Enlaces</h1>
        <p className="max-w-[68ch]">
          Los botones de <Link href="/enlaces">siete8.com/enlaces</Link>, la
          página para la biografía de tus redes. Para saber de qué red llega
          cada visita, usa el enlace con su origen, por ejemplo
          siete8.com/enlaces?utm_source=instagram.
        </p>
      </div>
      {buttons.map((item) => (
        <ButtonEditor key={item.id} item={item} />
      ))}
      <ButtonEditor />
    </div>
  );
}
