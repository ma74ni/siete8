import "server-only";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { adminPaths } from "@/lib/admin-paths";
import type { clientServiceForm, FormState } from "@/lib/admin-forms";
import type { ImportClient, ImportService } from "@/lib/client-import";
import type { Json } from "@/lib/database.types";
import { INVALID } from "@/server/admin-action-helpers";
import { createSessionClient } from "@/server/supabase/session";

// What the clients' actions share (E14-04): they live apart, by topic, and a
// "use server" file only exports actions. Texts from docs/COPY.md §13.

export const DUPLICATE_TAX_ID: FormState = {
  status: "error",
  message: "Ya hay un cliente con ese RUC o cédula.",
};

/** The message of the first field that failed, or the generic one. */
export function invalid(error: z.ZodError): FormState {
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

export function refreshClients() {
  revalidatePath(adminPaths.clients, "layout");
  revalidatePath(adminPaths.owed);
  revalidatePath(adminPaths.due);
}

export function toImportService(
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
 * (`import_clients`): the forms and the CSV import go through it.
 */
export async function importClients(payload: ImportClient[]) {
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
