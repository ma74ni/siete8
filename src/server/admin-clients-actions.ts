"use server";

import "server-only";

import { redirect } from "next/navigation";

import {
  acceptProformaForm,
  clientForm,
  clientLeadForm,
  clientServiceForm,
  type FormState,
  idForm,
} from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import type { ImportClient } from "@/lib/client-import";
import type { Json } from "@/lib/database.types";
import {
  failed,
  INVALID,
  parse,
  PROFORMA_DECIDED,
  redirectWithNotice,
  refreshLeads,
} from "@/server/admin-action-helpers";
import {
  DUPLICATE_TAX_ID,
  importClients,
  invalid,
  refreshClients,
  toImportService,
} from "@/server/admin-client-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Panel writes of the clients themselves (E11-01, E14-04): create, accept a
// proforma, edit and delete. Their services, payments and the import have
// their own files. Every action checks the admin role, validates with Zod and
// writes as the signed-in user (RLS applies). Clients are not on the public
// site: only the panel pages change. Texts from docs/COPY.md §13.

/**
 * "Este lead ya tiene cliente: {nombre}." when the lead already has one; the
 * unique `client.lead_id` allows only one ("Crear cliente", RF-CRM-20).
 */
async function leadAlreadyLinked(leadId: string): Promise<FormState | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client")
    .select("name")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (error) return failed("crear el cliente");
  return data
    ? { status: "error", message: `Este lead ya tiene cliente: ${data.name}.` }
    : null;
}

/**
 * New client, with its first service if one was chosen (RF-CRM-04), and
 * linked to the lead it comes from ("Crear cliente", RF-CRM-20).
 */
export async function createClient(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const client = parse(clientForm, formData);
  if (!client.success) return invalid(client.error);
  const lead = parse(clientLeadForm, formData);
  if (!lead.success) return INVALID;
  const withService = Boolean(formData.get("service_id"));
  const service = withService ? parse(clientServiceForm, formData) : null;
  if (service && !service.success) return invalid(service.error);

  const { kind, name, tax_id, phone, email, notes } = client.data;
  const { lead_id } = lead.data;
  // The import adds services to an existing RUC; a new client must not.
  if (tax_id) {
    const supabase = await createSessionClient();
    const { data: existing, error } = await supabase
      .from("client")
      .select("id")
      .eq("tax_id", tax_id)
      .maybeSingle();
    if (error) return failed("crear el cliente");
    if (existing) return DUPLICATE_TAX_ID;
  }
  if (lead_id) {
    const linked = await leadAlreadyLinked(lead_id);
    if (linked) return linked;
  }

  const { error, result } = await importClients([
    {
      kind,
      name,
      tax_id,
      phone,
      email,
      notes,
      lead_id,
      services: service?.success ? [toImportService(service.data)] : [],
    },
  ]);
  if (error) {
    if (error.code !== "23505") return failed("crear el cliente");
    // Two saves at once: the lead got its client in the other one.
    if (lead_id && error.message.includes("client_lead_id_key")) {
      return (await leadAlreadyLinked(lead_id)) ?? DUPLICATE_TAX_ID;
    }
    return DUPLICATE_TAX_ID;
  }
  refreshClients();
  redirect(adminPaths.client(result!.first_client_id!));
}

/**
 * "Aceptar proforma" (RF-CRM-19): creates the client from the lead (or adds
 * the service to the lead's client) with its first period, marks the
 * proforma accepted and the lead won, all in `accept_proforma`, which also
 * refuses a RUC that is already another client's.
 */
export async function acceptProforma(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const proforma = parse(acceptProformaForm, formData);
  if (!proforma.success) return INVALID;
  const client = parse(clientForm, formData);
  if (!client.success) return invalid(client.error);
  const service = parse(clientServiceForm, formData);
  if (!service.success) return invalid(service.error);

  const { kind, name, tax_id, phone, email, notes } = client.data;
  const payload: ImportClient = {
    kind,
    name,
    tax_id,
    phone,
    email,
    notes,
    services: [toImportService(service.data)],
  };
  const supabase = await createSessionClient();
  const { data: clientId, error } = await supabase.rpc("accept_proforma", {
    p_proforma_id: proforma.data.proforma_id,
    client: payload as unknown as Json,
  });
  if (error) {
    if (error.code === "55000") return PROFORMA_DECIDED;
    return error.code === "23505"
      ? DUPLICATE_TAX_ID
      : failed("aceptar la proforma");
  }
  refreshClients();
  refreshLeads();
  redirect(adminPaths.client(clientId));
}

/** "Editar datos": saves and goes back to the client's record. */
export async function updateClient(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(clientForm, formData);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...fields } = parsed.data;
  if (!id) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase.from("client").update(fields).eq("id", id);
  if (error) {
    return error.code === "23505"
      ? DUPLICATE_TAX_ID
      : failed("guardar el cliente");
  }
  refreshClients();
  redirectWithNotice(adminPaths.client(id), "cliente-guardado");
}

export async function deleteClient(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("client")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failed("borrar el cliente");
  refreshClients();
  redirectWithNotice(adminPaths.clients, "cliente-borrado");
}
