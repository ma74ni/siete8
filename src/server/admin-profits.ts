import "server-only";

import type { ProfitData } from "@/lib/profits";
import { requireAdmin } from "@/server/auth";
import { createSessionClient } from "@/server/supabase/session";

/**
 * Panel reads of "Ganancias" (E11-06). RLS: only admins read these tables.
 * Small volume: everything is loaded and added up in `@/lib/profits`.
 */
export async function getProfitData(): Promise<ProfitData> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [periods, purchases] = await Promise.all([
    supabase.from("client_service_period").select(
      `id, sold_on, price_without_vat, vat_rate, cost_without_vat, written_off_on,
         client_payment(paid_on, amount),
         client_service(id, service_id, service(name), client(id, name))`,
    ),
    supabase.from("purchase").select(
      `id, concept, client_service_id, provider(name),
         purchase_service(service(id, name)),
         purchase_payment(paid_on, covers_from, covers_to, quantity, amount, vat_amount, isd_amount),
         license_assignment(client_service_id)`,
    ),
  ]);
  const error = periods.error ?? purchases.error;
  if (error) throw new Error(`Could not load profits: ${error.message}`);

  // A period's cost is paid through a purchase when its service has its own
  // purchase or uses licenses of one: in cash, the payment is the cost.
  const backed = new Set<string>();
  for (const purchase of purchases.data!) {
    if (purchase.client_service_id) backed.add(purchase.client_service_id);
    for (const license of purchase.license_assignment) {
      if (license.client_service_id) backed.add(license.client_service_id);
    }
  }

  return {
    periods: periods.data!.flatMap((period) => {
      const service = period.client_service;
      if (!service?.client) return [];
      return [
        {
          id: period.id,
          clientId: service.client.id,
          client: service.client.name,
          serviceId: service.service_id,
          service: service.service?.name ?? "",
          soldOn: period.sold_on,
          priceWithoutVat: period.price_without_vat,
          vatRate: period.vat_rate,
          cost: period.cost_without_vat,
          writtenOffOn: period.written_off_on,
          purchaseBacked: backed.has(service.id),
          payments: period.client_payment.map((payment) => ({
            paidOn: payment.paid_on,
            amount: payment.amount,
          })),
        },
      ];
    }),
    purchases: purchases.data!.map((purchase) => ({
      id: purchase.id,
      concept: purchase.concept,
      provider: purchase.provider?.name ?? "",
      clientServiceId: purchase.client_service_id,
      services: purchase.purchase_service.flatMap((link) =>
        link.service ? [{ id: link.service.id, name: link.service.name }] : [],
      ),
      assignedLicenses: purchase.license_assignment.length,
      clientLicenses: purchase.license_assignment.filter(
        (license) => license.client_service_id !== null,
      ).length,
      payments: purchase.purchase_payment.map((payment) => ({
        paidOn: payment.paid_on,
        coversFrom: payment.covers_from,
        coversTo: payment.covers_to,
        quantity: payment.quantity,
        amount: payment.amount,
        vatAmount: payment.vat_amount,
        isdAmount: payment.isd_amount,
      })),
    })),
  };
}
