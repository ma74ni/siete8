"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import {
  acceptProformaForm,
  clientForm,
  clientLeadForm,
  clientServiceForm,
  clientServiceUpdateForm,
  type FormState,
  formValues,
  idForm,
  markPaidBeforeForm,
  paymentForm,
  periodForm,
  periodIdForm,
  renewForm,
  writeOffForm,
} from "@/lib/admin-forms";
import {
  buildImport,
  formatDay,
  type ImportClient,
  type ImportService,
  type ImportState,
  parseCsv,
  todayInQuito,
} from "@/lib/clients";
import type { Json } from "@/lib/database.types";
import { periodBalance } from "@/lib/payments";
import {
  failed,
  INVALID,
  parse,
  PROFORMA_DECIDED,
  refreshLeads,
} from "@/server/admin-action-helpers";
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
  revalidatePath("/admin/por-cobrar");
  revalidatePath("/admin/por-vencer");
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
  redirect(`/admin/clientes/${result!.first_client_id}`);
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
  redirect(`/admin/clientes/${clientId}`);
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

/**
 * "Renovar" (E11-04, RF-CRM-13): adds the next period, prefilled in the form
 * with the previous price and cost. One-off and cancelled services do not
 * renew; the panel hides the button for them, and this checks it again.
 */
export async function renewClientService(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(renewForm, formData);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSessionClient();
  const { data: service, error } = await supabase
    .from("client_service")
    .select("status, renews_every_unit")
    .eq("id", parsed.data.client_service_id)
    .maybeSingle();
  if (error) return failed("renovar el servicio");
  if (!service) return INVALID;
  if (!service.renews_every_unit) {
    return {
      status: "error",
      message: "Este servicio es de pago único: no se renueva.",
    };
  }
  if (service.status === "cancelled") {
    return {
      status: "error",
      message: "Este servicio está cancelado: reactívalo para renovarlo.",
    };
  }

  const { error: insertError } = await supabase
    .from("client_service_period")
    .insert(parsed.data);
  if (insertError) return failed("renovar el servicio");
  refreshClients();
  return {
    status: "success",
    message: `Servicio renovado hasta el ${formatDay(parsed.data.ends_on)}.`,
  };
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

// Payments (E11-02) ---------------------------------------------------------------

/** "Pagado hoy": one payment for the whole balance, by transfer. */
export async function markPaidToday(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(periodIdForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data: period, error } = await supabase
    .from("client_service_period")
    .select(
      "price_without_vat, vat_rate, written_off_on, client_payment(amount)",
    )
    .eq("id", parsed.data.period_id)
    .single();
  if (error) return failed("registrar el pago");
  const { balanceCents } = periodBalance({
    ...period,
    // A period marked "no pagará" that gets paid after all.
    written_off_on: null,
    payments: period.client_payment,
  });
  if (balanceCents === 0) {
    return { status: "error", message: "Este período ya está pagado." };
  }

  const { error: insertError } = await supabase.from("client_payment").insert({
    period_id: parsed.data.period_id,
    paid_on: todayInQuito(),
    amount: balanceCents / 100,
    method: "transfer",
  });
  if (insertError) return failed("registrar el pago");
  refreshClients();
  return { status: "success", message: "Pago registrado." };
}

export async function addPayment(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(paymentForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase.from("client_payment").insert(parsed.data);
  if (error) return failed("registrar el pago");
  refreshClients();
  return { status: "success", message: "Pago registrado." };
}

export async function deletePayment(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("client_payment")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failed("borrar el pago");
  refreshClients();
  return { status: "success", message: "Pago borrado." };
}

/** "No pagará": leaves the receivables and counts as a loss (RF-CRM-10). */
export async function writeOffPeriod(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(writeOffForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("client_service_period")
    .update({
      written_off_on: todayInQuito(),
      write_off_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.id);
  if (error) return failed("marcar como no pagará");
  refreshClients();
  return { status: "success", message: "Marcado como no pagará." };
}

export async function clearWriteOff(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("client_service_period")
    .update({ written_off_on: null, write_off_reason: null })
    .eq("id", parsed.data.id);
  if (error) return failed('quitar "no pagará"');
  refreshClients();
  return { status: "success", message: '"No pagará" quitado.' };
}

/**
 * For clients loaded before payments existed: every period sold before the
 * date with a balance gets one payment for it, on its sale day ("Otro").
 * One insert, so it is all or nothing.
 */
export async function markPaidBefore(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(markPaidBeforeForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client_service_period")
    .select(
      "id, sold_on, price_without_vat, vat_rate, written_off_on, client_payment(amount)",
    )
    .lt("sold_on", parsed.data.before)
    .is("written_off_on", null);
  if (error) return failed("marcar como pagados");

  const payments = data.flatMap((period) => {
    const { balanceCents } = periodBalance({
      ...period,
      payments: period.client_payment,
    });
    return balanceCents > 0
      ? [
          {
            period_id: period.id,
            paid_on: period.sold_on,
            amount: balanceCents / 100,
            method: "other" as const,
          },
        ]
      : [];
  });
  if (payments.length === 0) {
    return {
      status: "error",
      message: "Ningún período con saldo antes de esa fecha.",
    };
  }
  const { error: insertError } = await supabase
    .from("client_payment")
    .insert(payments);
  if (insertError) return failed("marcar como pagados");
  refreshClients();
  return {
    status: "success",
    message:
      payments.length === 1
        ? "1 período marcado como pagado."
        : `${payments.length} períodos marcados como pagados.`,
  };
}
