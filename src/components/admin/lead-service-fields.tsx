"use client";

import { useState } from "react";

import { ServicePlanSelects } from "@/components/admin/client-service-fields";
import type { CatalogService } from "@/lib/clients";

// Texts from docs/COPY.md §13 (Leads: Nuevo).

/** The service and plan a lead asked about; both optional (E11-07). */
export function LeadServiceFields({ catalog }: { catalog: CatalogService[] }) {
  const [serviceId, setServiceId] = useState("");
  const [planId, setPlanId] = useState("");

  return (
    <ServicePlanSelects
      catalog={catalog}
      idPrefix="lead"
      serviceId={serviceId}
      planId={planId}
      onServiceChange={(id) => {
        setServiceId(id);
        setPlanId("");
      }}
      onPlanChange={setPlanId}
      optional
    />
  );
}
