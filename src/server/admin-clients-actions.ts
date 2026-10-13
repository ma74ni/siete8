"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import {
  clientForm,
  clientServiceForm,
  clientServiceUpdateForm,
  type FormState,
  formValues,
  idForm,
  periodForm,
} from "@/lib/admin-forms";
import {
  buildImport,
  type ImportClient,
  type ImportService,
  type ImportState,
  parseCsv,
  todayInQuito,
} from "@/lib/clients";
import type { Json } from "@/lib/database.types";
import { failed, INVALID, parse } from "@/server/admin-action-helpers";
import { getClientCatalog, getExistingTaxIds } from "@/server/admin-clients";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Panel writes of the clients (E11-01). Every action checks the admin role,
// validates with Zod and writes as the signed-in user (RLS applies). Clients
// are not on the public site: only the panel pages change. Texts from
// docs/COPY.md §13.

const DUPLICATE_TAX_ID: FormState = {
  status: "error",
  message: "Ya hay un cliente con ese RUC o cédula.",
};

/** The message of the first field that failed, or the generic one. */
function invalid(error: z.ZodError): FormState {
  const fields = error.issues.map((issue) => issue.path[0]);
  if (fields.includes("tax_id")) {
    return {
      status: "error",
      message: "El RUC tiene 13 dígitos y la cédula 10.",
    };
  }
  if (fields.includes("ends_on")) {
    return {
      status: "error",
      message: "La fecha Hasta debe ser posterior a Desde.",
    };
  }
  return INVALID;
}

function refreshClients() {
  revalidatePath("/admin/clientes", "layout");
}

function toImportService(
  form: z.infer<typeof clientServiceForm>,
): ImportService {
  return {
    service_id: form.service_id,
    plan_id: form.plan_id,
    detail: form.detail,
    renews_every_value: form.renews_every_value,
    renews_every_unit: form.renews_every_unit,
    notes: form.service_notes,
    period: {
      sold_on: form.sold_on,
      starts_on: form.starts_on,
      ends_on: form.ends_on,
      price_without_vat: form.price_without_vat,
      vat_rate: form.vat_rate,
      cost_without_vat: form.cost_without_vat,
    },
  };
}

/**
 * Creates the clients, their services and first periods in one transaction
 * (`import_clients`): the form and the CSV import go through it.
 */
async function importClients(payload: ImportClient[]) {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("import_clients", {
    payload: payload as unknown as Json,
  });
  return {
    error,
    result: data as {
      clients_created: number;
      clients_existing: number;
      services_created: number;
      first_client_id: string | null;
    } | null,
  };
}

/** New client, with its first service if one was chosen (RF-CRM-04). */
export async function createClient(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const client = parse(clientForm, formData);
  if (!client.success) return invalid(client.error);
  const withService = Boolean(formData.get("service_id"));
  const service = withService ? parse(clientServiceForm, formData) : null;
  if (service && !service.success) return invalid(service.error);

  const { kind, name, tax_id, phone, email, notes } = client.data;
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

  const { error, result } = await importClients([
    {
      kind,
      name,
      tax_id,
      phone,
      email,
      notes,
      services: service?.success ? [toImportService(service.data)] : [],
    },
  ]);
  if (error) {
    return error.code === "23505"
      ? DUPLICATE_TAX_ID
      : failed("crear el cliente");
  }
  refreshClients();
  redirect(`/admin/clientes/${result!.first_client_id}`);
}

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
  return { status: "success", message: "Cliente guardado." };
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
  redirect("/admin/clientes");
}

export async function addClientService(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(clientServiceForm, formData);
  if (!parsed.success) return invalid(parsed.error);
  if (!parsed.data.client_id) return INVALID;

  const { error } = await importClients([
    {
      id: parsed.data.client_id,
      // Ignored for an existing client; the payload type asks for them.
      kind: "person",
      name: "",
      tax_id: null,
      phone: null,
      email: null,
      notes: null,
      services: [toImportService(parsed.data)],
    },
  ]);
  if (error) return failed("agregar el servicio");
  refreshClients();
  return { status: "success", message: "Servicio agregado." };
}

export async function updateClientService(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(clientServiceUpdateForm, formData);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("client_service")
    .update(fields)
    .eq("id", id);
  if (error) return failed("guardar el servicio");
  refreshClients();
  return { status: "success", message: "Servicio guardado." };
}

export async function savePeriod(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(periodForm, formData);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("client_service_period")
    .update(fields)
    .eq("id", id);
  if (error) return failed("guardar el período");
  refreshClients();
  return { status: "success", message: "Período guardado." };
}

async function setServiceStatus(
  formData: FormData,
  cancel: boolean,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("client_service")
    .update(
      cancel
        ? { status: "cancelled", cancelled_at: new Date().toISOString() }
        : { status: "active", cancelled_at: null },
    )
    .eq("id", parsed.data.id);
  if (error)
    return failed(cancel ? "cancelar el servicio" : "reactivar el servicio");
  refreshClients();
  return {
    status: "success",
    message: cancel ? "Servicio cancelado." : "Servicio reactivado.",
  };
}

export async function cancelClientService(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return setServiceStatus(formData, true);
}

export async function reactivateClientService(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return setServiceStatus(formData, false);
}

// Import (RF-CRM-07) --------------------------------------------------------------

const MAX_CSV_CHARS = 1_000_000;

/**
 * "Revisar archivo" shows what would be imported; "Importar" checks the same
 * text again and saves it all or nothing. The browser sends the file's text,
 * which is never trusted: it is parsed and validated on every call.
 */
export async function importClientsCsv(
  _state: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireAdmin();
  const { csv = "", intent } = formValues(formData);
  if (!csv.trim() || csv.length > MAX_CSV_CHARS) {
    return {
      status: "error",
      message: "Elige el archivo CSV con tus clientes.",
      errors: [],
    };
  }

  const [catalog, existing] = await Promise.all([
    getClientCatalog(),
    getExistingTaxIds(),
  ]);
  const result = buildImport(parseCsv(csv), catalog, existing, todayInQuito());
  if (result.errors.length > 0) {
    return {
      status: "error",
      message: "Corrige el archivo y súbelo de nuevo; no se guardó nada.",
      errors: result.errors,
    };
  }
  if (intent !== "import") {
    return {
      status: "preview",
      newClients: result.newClients,
      existingClients: result.existingClients,
      services: result.services,
    };
  }

  const { error, result: saved } = await importClients(result.clients);
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Hay dos clientes con el mismo RUC o cédula. Corrige el archivo y súbelo de nuevo; no se guardó nada."
          : "No se pudo importar. Inténtalo de nuevo; si sigue fallando, avísanos.",
      errors: [],
    };
  }
  refreshClients();
  return {
    status: "done",
    message: `${saved!.clients_created} clientes y ${saved!.services_created} servicios importados.`,
  };
}
