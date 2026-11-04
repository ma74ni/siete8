"use server";

import "server-only";

import {
  clientServiceForm,
  clientServiceUpdateForm,
  type FormState,
  idForm,
  periodForm,
  renewForm,
} from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import { formatDay } from "@/lib/days";
import {
  failed,
  INVALID,
  parse,
  redirectWithNotice,
} from "@/server/admin-action-helpers";
import {
  importClients,
  invalid,
  refreshClients,
  toImportService,
} from "@/server/admin-client-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Panel writes of a client's services (E11-01, E11-04, E14-04): add, edit,
// renew, cancel and reactivate them, and edit a period of their history.
// Texts from docs/COPY.md §13.

/** "Agregar servicio": saves and goes back to the client's record. */
export async function addClientService(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(clientServiceForm, formData);
  if (!parsed.success) return invalid(parsed.error);
  const clientId = parsed.data.client_id;
  if (!clientId) return INVALID;

  const { error } = await importClients([
    {
      id: clientId,
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
  redirectWithNotice(adminPaths.client(clientId), "servicio-agregado");
}

/** "Editar servicio": saves and goes back to the service's page. */
export async function updateClientService(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(clientServiceUpdateForm, formData);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client_service")
    .update(fields)
    .eq("id", id)
    .select("client_id")
    .single();
  if (error) return failed("guardar el servicio");
  refreshClients();
  redirectWithNotice(
    adminPaths.clientService(data.client_id, id),
    "servicio-guardado",
  );
}

/** A period of the history: saves and goes back to its service's page. */
export async function savePeriod(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(periodForm, formData);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...fields } = parsed.data;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client_service_period")
    .update(fields)
    .eq("id", id)
    .select("client_service(id, client_id)")
    .single();
  if (error || !data.client_service) return failed("guardar el período");
  refreshClients();
  redirectWithNotice(
    adminPaths.clientService(
      data.client_service.client_id,
      data.client_service.id,
    ),
    "periodo-guardado",
  );
}

/**
 * Adds the next period (E11-04, RF-CRM-13), prefilled in the form with the
 * previous price and cost. One-off and cancelled services do not renew; the
 * panel hides the button for them, and this checks it again.
 */
async function addRenewal(
  formData: FormData,
): Promise<
  { error: FormState } | { clientId: string; serviceId: string; endsOn: string }
> {
  await requireAdmin();
  const parsed = parse(renewForm, formData);
  if (!parsed.success) return { error: invalid(parsed.error) };

  const supabase = await createSessionClient();
  const { data: service, error } = await supabase
    .from("client_service")
    .select("client_id, status, renews_every_unit")
    .eq("id", parsed.data.client_service_id)
    .maybeSingle();
  if (error) return { error: failed("renovar el servicio") };
  if (!service) return { error: INVALID };
  if (!service.renews_every_unit) {
    return {
      error: {
        status: "error",
        message: "Este servicio es de pago único: no se renueva.",
      },
    };
  }
  if (service.status === "cancelled") {
    return {
      error: {
        status: "error",
        message: "Este servicio está cancelado: reactívalo para renovarlo.",
      },
    };
  }

  const { error: insertError } = await supabase
    .from("client_service_period")
    .insert(parsed.data);
  if (insertError) return { error: failed("renovar el servicio") };
  refreshClients();
  return {
    clientId: service.client_id,
    serviceId: parsed.data.client_service_id,
    endsOn: parsed.data.ends_on,
  };
}

/** "Renovar" from a list (Por vencer): the list stays, with the message. */
export async function renewClientService(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const renewal = await addRenewal(formData);
  if ("error" in renewal) return renewal.error;
  return {
    status: "success",
    message: `Servicio renovado hasta el ${formatDay(renewal.endsOn)}.`,
  };
}

/** "Renovar" on its own page: goes back to the service's page. */
export async function renewClientServiceFromPage(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const renewal = await addRenewal(formData);
  if ("error" in renewal) return renewal.error;
  redirectWithNotice(
    adminPaths.clientService(renewal.clientId, renewal.serviceId),
    "servicio-renovado",
  );
}

async function setServiceStatus(
  formData: FormData,
  cancel: boolean,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client_service")
    .update(
      cancel
        ? { status: "cancelled", cancelled_at: new Date().toISOString() }
        : { status: "active", cancelled_at: null },
    )
    .eq("id", parsed.data.id)
    .select("client_id")
    .single();
  if (error)
    return failed(cancel ? "cancelar el servicio" : "reactivar el servicio");
  refreshClients();
  // One button replaces the other, and its message with it: back with a notice.
  redirectWithNotice(
    adminPaths.clientService(data.client_id, parsed.data.id),
    cancel ? "servicio-cancelado" : "servicio-reactivado",
  );
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
