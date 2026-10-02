import { ActionForm } from "@/components/admin/action-form";
import { Section } from "@/components/admin/fields";
import { FormField } from "@/components/sitio/form-field";
import { requireAdmin } from "@/server/auth";
import { saveSettings } from "@/server/admin-settings-actions";
import { getSiteSettings } from "@/server/site-settings";

// Texts from docs/COPY.md §13.

/** Rows offered for social networks: the current ones plus empty slots. */
const SOCIAL_ROWS = 8;

/**
 * Site settings (E4-08, RF-ADM-08): WhatsApp, hours, phone, email and social
 * networks. Saving updates every page of the site.
 */
export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();
  const rows = Array.from(
    { length: SOCIAL_ROWS },
    (_, index) => settings.social[index] ?? { label: "", url: "" },
  );

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2">Configuración</h1>
        <p>
          Lo que guardes aquí cambia en todo el sitio: los botones de WhatsApp,
          el pie de página, Contacto y los datos para Google.
        </p>
      </div>
      <ActionForm
        action={saveSettings}
        submitLabel="Guardar configuración"
        resetKey={JSON.stringify(settings)}
      >
        <Section title="WhatsApp y horario">
          <FormField
            label="WhatsApp"
            name="whatsapp"
            type="tel"
            required
            defaultValue={settings.whatsapp.number}
            hint="Como se marca en Ecuador, con el 0: 0967155626. Los enlaces de WhatsApp se arman solos."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Abre"
              name="from"
              type="time"
              required
              defaultValue={settings.whatsapp.from}
            />
            <FormField
              label="Cierra"
              name="to"
              type="time"
              required
              defaultValue={settings.whatsapp.to}
              hint="Todos los días. Los textos escritos a mano en los servicios (pasos, preguntas) se cambian en cada servicio."
            />
          </div>
        </Section>
        <Section title="Teléfono y correo">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Teléfono"
              name="phone"
              type="tel"
              required
              defaultValue={settings.phone}
            />
            <FormField
              label="Correo"
              name="email"
              type="email"
              required
              defaultValue={settings.email}
            />
          </div>
        </Section>
        <Section title="Redes sociales">
          <p className="max-w-[68ch]">
            En el pie de página y en Contacto, en este orden. Deja la fila vacía
            para quitar una red.
          </p>
          <ul className="flex flex-col gap-4">
            {rows.map((row, index) => (
              <li key={index} className="grid gap-4 md:grid-cols-[12rem_1fr]">
                <FormField
                  label={`Red ${index + 1}`}
                  name="social_label"
                  id={`social-label-${index}`}
                  maxLength={30}
                  defaultValue={row.label}
                  hint={index === 0 ? "Ej: Instagram" : undefined}
                />
                <FormField
                  label="Enlace"
                  name="social_url"
                  id={`social-url-${index}`}
                  type="url"
                  defaultValue={row.url}
                  hint={index === 0 ? "Con https://" : undefined}
                />
              </li>
            ))}
          </ul>
        </Section>
      </ActionForm>
    </div>
  );
}
