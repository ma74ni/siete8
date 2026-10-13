import { SelectField } from "@/components/admin/fields";
import { FormField } from "@/components/sitio/form-field";
import { CLIENT_KIND_LABELS, type ClientKind } from "@/lib/clients";

// Texts from docs/COPY.md §13 (Clientes: Datos del cliente).

type ClientValues = {
  kind: ClientKind;
  name: string;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

/** The client's own data, for "Nuevo cliente" and the client page (E11-01). */
export function ClientFields({ client }: { client?: ClientValues }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
        <SelectField
          label="Tipo"
          id="client-kind"
          name="kind"
          defaultValue={client?.kind ?? "person"}
        >
          {(Object.keys(CLIENT_KIND_LABELS) as ClientKind[]).map((kind) => (
            <option key={kind} value={kind}>
              {CLIENT_KIND_LABELS[kind]}
            </option>
          ))}
        </SelectField>
        <FormField
          label="Nombre"
          name="name"
          id="client-name"
          required
          maxLength={200}
          defaultValue={client?.name}
          hint="Persona: nombres y apellidos. Empresa: razón social."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          label="RUC o cédula"
          name="tax_id"
          id="client-tax-id"
          inputMode="numeric"
          maxLength={13}
          defaultValue={client?.tax_id ?? ""}
          hint="Solo el número: 10 dígitos la cédula, 13 el RUC. Opcional."
        />
        <FormField
          label="Celular"
          name="phone"
          id="client-phone"
          type="tel"
          defaultValue={client?.phone ?? ""}
        />
        <FormField
          label="Correo"
          name="email"
          id="client-email"
          type="email"
          defaultValue={client?.email ?? ""}
        />
      </div>
      <FormField
        label="Notas"
        name="notes"
        id="client-notes"
        multiline
        maxLength={4000}
        defaultValue={client?.notes ?? ""}
        hint="Solo las ves tú, en el panel."
      />
    </>
  );
}
