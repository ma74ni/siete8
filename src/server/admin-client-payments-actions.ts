"use server";

import "server-only";

import {
  type FormState,
  idForm,
  markPaidBeforeForm,
  paymentForm,
  periodIdForm,
  writeOffForm,
} from "@/lib/admin-forms";
import { adminPaths } from "@/lib/admin-paths";
import { todayInQuito } from "@/lib/days";
import { periodBalance } from "@/lib/payments";
import {
  failed,
  INVALID,
  parse,
  redirectWithNotice,
} from "@/server/admin-action-helpers";
import { refreshClients } from "@/server/admin-client-helpers";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

// Panel writes of what clients pay (E11-02, E14-04): payments, "Pagado hoy"
// and "no pagará". Texts from docs/COPY.md §13.

/** Where a period lives: its service and client, to go back to their pages. */
type PeriodPlace = { clientId: string; serviceId: string };

const PLACE = "client_service(id, client_id)";

function placeOf(
  service: { id: string; client_id: string } | null,
): PeriodPlace | null {
  return service
    ? { clientId: service.client_id, serviceId: service.id }
    : null;
}

/** One payment for the whole balance of a period, today, by transfer. */
async function payBalanceToday(
  formData: FormData,
): Promise<{ error: FormState } | PeriodPlace> {
  await requireAdmin();
  const parsed = parse(periodIdForm, formData);
  if (!parsed.success) return { error: INVALID };

  const supabase = await createSessionClient();
  const { data: period, error } = await supabase
    .from("client_service_period")
    .select(
      `price_without_vat, vat_rate, written_off_on, client_payment(amount), ${PLACE}`,
    )
    .eq("id", parsed.data.period_id)
    .single();
  const place = placeOf(period?.client_service ?? null);
  if (error || !place) return { error: failed("registrar el pago") };
  const { balanceCents } = periodBalance({
    ...period,
    // A period marked "no pagará" that gets paid after all.
    written_off_on: null,
    payments: period.client_payment,
  });
  if (balanceCents === 0) {
    return {
      error: { status: "error", message: "Este período ya está pagado." },
    };
  }

  const { error: insertError } = await supabase.from("client_payment").insert({
    period_id: parsed.data.period_id,
    paid_on: todayInQuito(),
    amount: balanceCents / 100,
    method: "transfer",
  });
  if (insertError) return { error: failed("registrar el pago") };
  refreshClients();
  return place;
}

/** "Pagado hoy" in a list (Por cobrar): the list stays, with the message. */
export async function markPaidToday(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const paid = await payBalanceToday(formData);
  if ("error" in paid) return paid.error;
  return { status: "success", message: "Pago registrado." };
}

/**
 * "Pagado hoy" on the service's page: the button goes away with the debt,
 * so the page comes back with the notice instead.
 */
export async function markPaidTodayFromPage(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const paid = await payBalanceToday(formData);
  if ("error" in paid) return paid.error;
  redirectWithNotice(
    adminPaths.clientService(paid.clientId, paid.serviceId),
    "pago-registrado",
  );
}

/** "Registrar pago": saves and goes back to the service's page. */
export async function addPayment(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(paymentForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data: period, error: periodError } = await supabase
    .from("client_service_period")
    .select(PLACE)
    .eq("id", parsed.data.period_id)
    .single();
  const place = placeOf(period?.client_service ?? null);
  if (periodError || !place) return failed("registrar el pago");
  const { error } = await supabase.from("client_payment").insert(parsed.data);
  if (error) return failed("registrar el pago");
  refreshClients();
  redirectWithNotice(
    adminPaths.clientService(place.clientId, place.serviceId),
    "pago-registrado",
  );
}

export async function deletePayment(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client_payment")
    .delete()
    .eq("id", parsed.data.id)
    .select(`period_id, client_service_period(${PLACE})`)
    .single();
  const place = placeOf(data?.client_service_period?.client_service ?? null);
  if (error || !place) return failed("borrar el pago");
  refreshClients();
  // The deleted row took its button and message with it: back with a notice.
  redirectWithNotice(
    adminPaths.clientServicePeriod(
      place.clientId,
      place.serviceId,
      data.period_id,
    ),
    "pago-borrado",
  );
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
  const { data, error } = await supabase
    .from("client_service_period")
    .update({
      written_off_on: todayInQuito(),
      write_off_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.id)
    .select(PLACE)
    .single();
  const place = placeOf(data?.client_service ?? null);
  if (error || !place) return failed("marcar como no pagará");
  refreshClients();
  redirectWithNotice(
    adminPaths.clientServicePeriod(
      place.clientId,
      place.serviceId,
      parsed.data.id,
    ),
    "periodo-no-pagara",
  );
}

export async function clearWriteOff(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(idForm, formData);
  if (!parsed.success) return INVALID;

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("client_service_period")
    .update({ written_off_on: null, write_off_reason: null })
    .eq("id", parsed.data.id)
    .select(PLACE)
    .single();
  const place = placeOf(data?.client_service ?? null);
  if (error || !place) return failed('quitar "no pagará"');
  refreshClients();
  redirectWithNotice(
    adminPaths.clientServicePeriod(
      place.clientId,
      place.serviceId,
      parsed.data.id,
    ),
    "no-pagara-quitado",
  );
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
