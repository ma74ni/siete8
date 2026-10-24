"use client";

import { useState } from "react";

import { PriceField } from "@/components/admin/price-field";
import { FormField } from "@/components/sitio/form-field";
import {
  type CatalogService,
  DEFAULT_VAT_RATE,
  type DurationUnit,
  endsAfter,
  formatDecimal,
  planRenewal,
  RENEWAL_UNIT_LABELS,
  type RenewalInput as Renewal,
} from "@/lib/clients";

// Texts from docs/COPY.md §13 (Clientes: Servicio del cliente).

const control =
  "min-h-12 w-full rounded-control border border-field-border bg-bg px-3 text-fg";

/** "Se renueva cada": a number and a unit, or a one-off payment. */
export function RenewalInputs({
  idPrefix,
  renewal,
  onChange,
}: {
  idPrefix: string;
  renewal: Renewal;
  onChange?: (renewal: Renewal) => void;
}) {
  const controlled = onChange !== undefined;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 font-medium">Se renueva cada</legend>
      <div className="flex gap-2">
        <label htmlFor={`${idPrefix}-renew-value`} className="sr-only">
          Cantidad
        </label>
        <input
          id={`${idPrefix}-renew-value`}
          name="renews_every_value"
          type="number"
          min={1}
          max={999}
          className={`${control} w-24 tabular-nums`}
          disabled={renewal.unit === ""}
          {...(controlled
            ? {
                value: renewal.value,
                onChange: (event) =>
                  onChange({ ...renewal, value: event.target.value }),
              }
            : { defaultValue: renewal.value })}
        />
        <label htmlFor={`${idPrefix}-renew-unit`} className="sr-only">
          Unidad
        </label>
        <select
          id={`${idPrefix}-renew-unit`}
          name="renews_every_unit"
          className={control}
          {...(controlled
            ? {
                value: renewal.unit,
                onChange: (event) =>
                  onChange({
                    value: renewal.value || "1",
                    unit: event.target.value as DurationUnit | "",
                  }),
              }
            : { defaultValue: renewal.unit })}
        >
          {(Object.keys(RENEWAL_UNIT_LABELS) as DurationUnit[]).map((unit) => (
            <option key={unit} value={unit}>
              {RENEWAL_UNIT_LABELS[unit]}
            </option>
          ))}
          <option value="">Pago único</option>
        </select>
      </div>
    </fieldset>
  );
}

/**
 * "Servicio" and "Plan" (E11-01, E11-05), controlled by the form that uses
 * them. Changing the service clears the plan; the plan list shows once there
 * is a service.
 */
export function ServicePlanSelects({
  catalog,
  idPrefix,
  serviceId,
  planId,
  onServiceChange,
  onPlanChange,
  planHint,
  optional = false,
}: {
  catalog: CatalogService[];
  idPrefix: string;
  serviceId: string;
  planId: string;
  onServiceChange: (id: string) => void;
  onPlanChange: (id: string) => void;
  planHint: string;
  /** Offers "Ninguno" as service. */
  optional?: boolean;
}) {
  const service = catalog.find((candidate) => candidate.id === serviceId);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-service`} className="font-medium">
          Servicio
        </label>
        <select
          id={`${idPrefix}-service`}
          name="service_id"
          className={control}
          value={serviceId}
          onChange={(event) => onServiceChange(event.target.value)}
          aria-describedby={`${idPrefix}-service-hint`}
        >
          {optional && <option value="">Ninguno</option>}
          {catalog.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
        <p id={`${idPrefix}-service-hint`} className="text-small">
          Incluye los servicios ocultos.
        </p>
      </div>
      {service && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-plan`} className="font-medium">
            Plan
          </label>
          <select
            id={`${idPrefix}-plan`}
            name="plan_id"
            className={control}
            value={planId}
            onChange={(event) => onPlanChange(event.target.value)}
            aria-describedby={`${idPrefix}-plan-hint`}
          >
            <option value="">Ninguno</option>
            {service.plans.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
          <p id={`${idPrefix}-plan-hint`} className="text-small">
            {planHint}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * A service of a client with its first period (RF-CRM-03, 04). Choosing a
 * plan fills in price, VAT, cost and renewal; "Hasta" follows "Desde" and the
 * renewal until it is typed by hand. Everything can be changed.
 */
export function ClientServiceFields({
  catalog,
  today,
  optional = false,
  idPrefix = "service",
  preset,
}: {
  catalog: CatalogService[];
  today: string;
  /** In "Nuevo cliente" the first service can be left for later. */
  optional?: boolean;
  idPrefix?: string;
  /**
   * What a proforma offered ("Aceptar proforma", E11-05): its service and
   * plan come chosen, with the offered price instead of the plan's.
   */
  preset?: {
    service_id: string;
    plan_id: string | null;
    price_without_vat: number;
    vat_rate: number;
  };
}) {
  const presetService = catalog.find(
    (candidate) => candidate.id === preset?.service_id,
  );
  const presetPlan = presetService?.plans.find(
    (candidate) => candidate.id === preset?.plan_id,
  );
  const presetRenewal = planRenewal(presetPlan);

  const [serviceId, setServiceId] = useState(
    presetService?.id ?? (optional ? "" : (catalog[0]?.id ?? "")),
  );
  const [planId, setPlanId] = useState(presetPlan?.id ?? "");
  const [renewal, setRenewal] = useState<Renewal>(presetRenewal);
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(endsAfter(today, presetRenewal));
  const [endsTyped, setEndsTyped] = useState(false);

  const service = catalog.find((candidate) => candidate.id === serviceId);
  const plan = service?.plans.find((candidate) => candidate.id === planId);
  // The offered price holds while the proforma's service and plan stay chosen.
  const offered =
    preset &&
    serviceId === preset.service_id &&
    planId === (presetPlan?.id ?? "")
      ? preset
      : null;

  const follow = (start: string, next: Renewal) => {
    if (endsTyped) return;
    setEndsOn(endsAfter(start, next));
  };

  const choosePlan = (id: string) => {
    setPlanId(id);
    const next = planRenewal(
      service?.plans.find((candidate) => candidate.id === id),
    );
    setRenewal(next);
    follow(startsOn, next);
  };

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
        onPlanChange={choosePlan}
        planHint="Al elegirlo se llenan el precio, el costo y el vencimiento; puedes cambiarlos."
        optional={optional}
      />

      {service && (
        <>
          <FormField
            label="Detalle"
            name="detail"
            id={`${idPrefix}-detail`}
            maxLength={200}
            hint="Por ejemplo: heladeria.com, 3 buzones, POS con 2 cajas, Mantenimiento del POS."
          />
          <div className="grid gap-4 md:grid-cols-4">
            <RenewalInputs
              idPrefix={idPrefix}
              renewal={renewal}
              onChange={(next) => {
                setRenewal(next);
                follow(startsOn, next);
              }}
            />
            <FormField
              label="Fecha de venta"
              name="sold_on"
              id={`${idPrefix}-sold-on`}
              type="date"
              required
              defaultValue={today}
            />
            <FormField
              label="Desde"
              name="starts_on"
              id={`${idPrefix}-starts-on`}
              type="date"
              required
              value={startsOn}
              onChange={(event) => {
                setStartsOn(event.target.value);
                follow(event.target.value, renewal);
              }}
            />
            <FormField
              label="Hasta"
              name="ends_on"
              id={`${idPrefix}-ends-on`}
              type="date"
              value={endsOn}
              onChange={(event) => {
                setEndsOn(event.target.value);
                setEndsTyped(true);
              }}
              hint="Vacío: no vence."
            />
          </div>
          {/* Remounts with the plan's values when the plan changes. */}
          <div key={planId} className="flex flex-wrap items-end gap-4">
            <PriceField
              idPrefix={idPrefix}
              price={offered?.price_without_vat ?? plan?.price_without_vat ?? 0}
              vatRate={offered?.vat_rate ?? plan?.vat_rate ?? DEFAULT_VAT_RATE}
              previewLabel="Con IVA"
            />
            <FormField
              label="Costo sin IVA"
              name="cost_without_vat"
              id={`${idPrefix}-cost`}
              inputMode="decimal"
              className="w-40"
              defaultValue={
                plan?.cost_without_vat != null
                  ? formatDecimal(plan.cost_without_vat)
                  : ""
              }
              hint="Vacío: sin costo directo."
            />
          </div>
          <FormField
            label="Notas"
            name="service_notes"
            id={`${idPrefix}-notes`}
            multiline
            maxLength={4000}
          />
        </>
      )}
    </div>
  );
}
