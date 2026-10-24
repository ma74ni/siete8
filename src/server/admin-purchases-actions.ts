"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import {
  type FormState,
  formValues,
  idForm,
  licenseForm,
  purchaseForm,
  purchasePaymentForm,
} from "@/lib/admin-forms";
import type { Json } from "@/lib/database.types";
import { failed, INVALID, parse } from "@/server/admin-action-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Panel writes of the purchases (E11-03). Every action checks the admin role,
// validates with Zod and writes as the signed-in user (RLS applies). Texts
// from docs/COPY.md §13.

function refreshPurchases() {
  revalidatePath("/admin/compras", "layout");
  // Client pages show their purchases and licenses.
  revalidatePath("/admin/clientes", "layout");
  revalidatePath("/admin/por-vencer");
}

/** The purchase form, with the checked services read as a list. */
function parsePurchase(formData: FormData) {
  return purchaseForm.safeParse({
    ...formValues(formData),
    service_ids: formData.getAll("service_ids").map(String),
  });
}

function invalidPurchase(error: z.ZodError): FormState {
  const fields = error.issues.map((issue) => issue.path[0]);
  if (fields.includes("provider_name")) {
    return {
      status: "error",
      message: "Escribe el nombre del proveedor nuevo.",
    };
  }
  if (fields.includes("client_service_id")) {
    return { status: "error", message: "Elige el cliente y servicio." };
  }
  return INVALID;
}

function toPayment(payment: z.infer<typeof purchasePaymentForm>) {
  return {
    paid_on: payment.paid_on,
    covers_from: payment.covers_from,
    covers_to: payment.covers_to,
    quantity: payment.paid_quantity,
    amount: payment.amount,
    vat_amount: payment.vat_amount,
    isd_amount: payment.isd_amount,
    notes: payment.payment_notes,
  };
}

/** New purchase with its provider, services and first payment, all at once. */
export async function createPurchase(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePurchase(formData);
  if (!parsed.success) return invalidPurchase(parsed.error);
  // The first payment is optional: it counts once its amount is written.
  const withPayment = Boolean(String(formData.get("amount") ?? "").trim());
  const payment = withPayment ? parse(purchasePaymentForm, formData) : null;
  if (payment && !payment.success) return INVALID;

  // A new purchase has no id: it is left out of the payload.
  const { provider_id, ...purchase } = parsed.data;
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("create_purchase", {
    payload: {
      ...purchase,
      provider_id: provider_id === "new" ? null : provider_id,
      payment: payment?.success ? toPayment(payment.data) : null,
    } as unknown as Json,
  });
  if (error) return failed("crear la compra");
  refreshPurchases();
  redirect(`/admin/compras/${data}`);
}

export async function updatePurchase(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePurchase(formData);
  if (!parsed.success) return invalidPurchase(parsed.error);
  const { id, provider_id, provider_name, service_ids, ...fields } =
    parsed.data;
  if (!id) return INVALID;

  const supabase = await createSessionClient();
  let providerId = provider_id;
  if (providerId === "new") {
    const { data, error } = await supabase
      .from("provider")
      .insert({ name: provider_name! })
      .select("id")
      .single();
    if (error) {
      return error.code === "23505"
        ? {
            status: "error",
            message: "Ya hay un proveedor con ese nombre: elígelo en la lista.",
          }
        : failed("guardar la compra");
    }
    providerId = data.id;
  }

  const { error } = await supabase
    .from("purchase")
    .update({ ...fields, provider_id: providerId })
    .eq("id", id);
  if (error) return failed("guardar la compra");

  // New services go in first and the others are removed after, so a failure
  // never leaves the purchase charged to nothing by mistake.
  if (service_ids.length > 0) {
    const { error: addError } = await supabase.from("purchase_service").upsert(
      service_ids.map((service_id) => ({ purchase_id: id, service_id })),
      { ignoreDuplicates: true },
    );
    if (addError) return failed("guardar la compra");
  }
  let stale = supabase.from("purchase_service").delete().eq("purchase_id", id);
  if (service_ids.length > 0) {
    stale = stale.not("service_id", "in", `(${service_ids.join(",")})`);
  }
  const { error: removeError } = await stale;
  if (removeError) return failed("guardar la compra");

  refreshPurchases();
  return { status: "success", message: "Compra guardada." };
}

export async function deletePurchase(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("purchase")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failed("borrar la compra");
  refreshPurchases();
  redirect("/admin/compras");
}

async function setPurchaseStatus(
  formData: FormData,
  cancel: boolean,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("purchase")
    .update(
      cancel
        ? { status: "cancelled", cancelled_at: new Date().toISOString() }
        : { status: "active", cancelled_at: null },
    )
    .eq("id", parsed.data.id);
  if (error)
    return failed(cancel ? "cancelar la compra" : "reactivar la compra");
  refreshPurchases();
  return {
    status: "success",
    message: cancel ? "Compra cancelada." : "Compra reactivada.",
  };
}

export async function cancelPurchase(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return setPurchaseStatus(formData, true);
}

export async function reactivatePurchase(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return setPurchaseStatus(formData, false);
}

export async function addPurchasePayment(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(purchasePaymentForm, formData);
  if (!parsed.success || !parsed.data.purchase_id) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase.from("purchase_payment").insert({
    purchase_id: parsed.data.purchase_id,
    ...toPayment(parsed.data),
  });
  if (error) return failed("registrar el pago");
  refreshPurchases();
  return { status: "success", message: "Pago registrado." };
}

export async function deletePurchasePayment(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("purchase_payment")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failed("borrar el pago");
  refreshPurchases();
  return { status: "success", message: "Pago borrado." };
}

export async function assignLicense(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(licenseForm, formData);
  if (!parsed.success) {
    return parsed.error.issues.some((issue) => issue.path[0] === "email") &&
      !String(formData.get("email") ?? "").trim()
      ? {
          status: "error",
          message: "Una licencia necesita un correo o un cliente.",
        }
      : INVALID;
  }

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("license_assignment")
    .insert(parsed.data);
  if (error) {
    return error.code === "23505"
      ? {
          status: "error",
          message: "Ya hay una licencia con ese correo en esta compra.",
        }
      : failed("asignar la licencia");
  }
  refreshPurchases();
  return { status: "success", message: "Licencia asignada." };
}

export async function removeLicense(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("license_assignment")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return failed("quitar la licencia");
  refreshPurchases();
  return { status: "success", message: "Licencia quitada." };
}
