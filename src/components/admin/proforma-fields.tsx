"use client";

import { useState } from "react";

import { ServicePlanSelects } from "@/components/admin/client-service-fields";
import { PriceField } from "@/components/admin/price-field";
import { type CatalogService, DEFAULT_VAT_RATE } from "@/lib/clients";

// Texts from docs/COPY.md §13 (Leads: Nueva proforma).

/**
 * Service, plan and offered price of a proforma (E11-05). Choosing a plan
 * fills in its price and VAT; the price can be changed before sending.
 */
export function ProformaFields({
  catalog,
  idPrefix = "proforma",
}: {
  catalog: CatalogService[];
  idPrefix?: string;
}) {
  const [serviceId, setServiceId] = useState(catalog[0]?.id ?? "");
  const [planId, setPlanId] = useState("");
  const plan = catalog
    .find((candidate) => candidate.id === serviceId)
    ?.plans.find((candidate) => candidate.id === planId);

  return (
    <div className="flex flex-col gap-4">
      <ServicePlanSelects
        catalog={catalog}
        idPrefix={idPrefix}
        serviceId={serviceId}
        planId={planId}
        onServiceChange={(id) => {
          setServiceId(id);
          setPlanId("");
        }}
        onPlanChange={setPlanId}
        planHint="Al elegirlo se llena el precio; puedes cambiarlo."
      />
      {/* Remounts with the plan's price when the plan changes. */}
      <div key={`${serviceId}-${planId}`}>
        <PriceField
          idPrefix={idPrefix}
          price={plan?.price_without_vat ?? 0}
          vatRate={plan?.vat_rate ?? DEFAULT_VAT_RATE}
          previewLabel="Con IVA"
        />
      </div>
    </div>
  );
}
