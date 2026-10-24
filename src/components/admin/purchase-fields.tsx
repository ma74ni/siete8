"use client";

import { useState } from "react";

import { CheckboxField } from "@/components/admin/checkbox-field";
import { RenewalInputs } from "@/components/admin/client-service-fields";
import { SelectField } from "@/components/admin/fields";
import { Radio } from "@/components/form/controls";
import { FormField } from "@/components/sitio/form-field";
import { type DurationUnit, formatDecimal, parseMoney } from "@/lib/clients";
import { formatCents } from "@/lib/price";
import { paymentTotalCents } from "@/lib/purchases";

// Texts from docs/COPY.md §13 (Compras).

type Option = { id: string; name: string };

export type PurchaseValues = {
  provider_id: string;
  concept: string;
  client_service_id: string | null;
  service_ids: string[];
  renews_every_value: number | null;
  renews_every_unit: DurationUnit | null;
  auto_renew: boolean;
  quantity: number;
  unit_cost: number;
  notes: string | null;
};

/**
 * The purchase's own data (RF-CRM-14): provider (or a new one), concept, what
 * it is charged to (one client's service or catalog services), renewal,
 * quantity and the platform's cost per unit.
 */
export function PurchaseFields({
  providers,
  services,
  clientServices,
  purchase,
}: {
  providers: Option[];
  services: Option[];
  clientServices: { id: string; label: string }[];
  purchase?: PurchaseValues;
}) {
  const [providerId, setProviderId] = useState(
    purchase?.provider_id ?? providers[0]?.id ?? "new",
  );
  const [chargeTo, setChargeTo] = useState<"client" | "services">(
    purchase?.client_service_id ? "client" : "services",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Proveedor"
          id="purchase-provider"
          name="provider_id"
          value={providerId}
          onChange={(event) => setProviderId(event.target.value)}
          hint="Elige uno o crea uno nuevo."
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
          <option value="new">Nuevo proveedor…</option>
        </SelectField>
        {providerId === "new" && (
          <FormField
            label="Nombre del proveedor nuevo"
            name="provider_name"
            id="purchase-provider-name"
            required
            maxLength={120}
          />
        )}
      </div>
      <FormField
        label="Concepto"
        name="concept"
        id="purchase-concept"
        required
        maxLength={200}
        defaultValue={purchase?.concept}
        hint="Por ejemplo: Hosting compartido, Microsoft 365 Business Basic, Dominio heladeria.test."
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1.5 font-medium">Se carga a</legend>
        <div className="flex flex-wrap gap-x-6">
          {(
            [
              ["client", "Un cliente"],
              ["services", "Servicios del catálogo"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex min-h-11 items-center gap-3">
              <Radio
                name="charge_to"
                value={value}
                checked={chargeTo === value}
                onChange={() => setChargeTo(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {chargeTo === "client" ? (
          <SelectField
            label="Cliente y servicio"
            id="purchase-client-service"
            name="client_service_id"
            defaultValue={purchase?.client_service_id ?? ""}
            required
          >
            <option value="">Elige uno</option>
            {clientServices.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.label}
              </option>
            ))}
          </SelectField>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="text-small">
              Si no marcas ninguno, es un gasto general.
            </p>
            <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <CheckboxField
                  key={service.id}
                  id={`purchase-service-${service.id}`}
                  name="service_ids"
                  value={service.id}
                  label={service.name}
                  defaultChecked={purchase?.service_ids.includes(service.id)}
                />
              ))}
            </div>
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <RenewalInputs
          idPrefix="purchase"
          renewal={{
            value: String(purchase?.renews_every_value ?? 1),
            unit: purchase ? (purchase.renews_every_unit ?? "") : "year",
          }}
        />
        <div className="flex items-end">
          <CheckboxField
            id="purchase-auto-renew"
            name="auto_renew"
            label="Se renueva sola (cobro automático a tu tarjeta)"
            defaultChecked={purchase?.auto_renew ?? false}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Cantidad"
          name="quantity"
          id="purchase-quantity"
          type="number"
          min={1}
          max={10_000}
          required
          defaultValue={purchase?.quantity ?? 1}
          hint="Licencias o unidades. Para un hosting o un dominio: 1."
        />
        <FormField
          label="Costo por unidad"
          name="unit_cost"
          id="purchase-unit-cost"
          inputMode="decimal"
          required
          defaultValue={purchase ? formatDecimal(purchase.unit_cost) : ""}
          hint="Lo que cobra la plataforma, sin los impuestos de aquí."
        />
      </div>
      <FormField
        label="Notas"
        name="notes"
        id="purchase-notes"
        multiline
        maxLength={4000}
        defaultValue={purchase?.notes ?? ""}
      />
    </div>
  );
}

/** Empty counts as zero (taxes that do not apply). */
const amountOf = (text: string) => (text.trim() ? parseMoney(text) : 0);

/**
 * A payment to the provider: the platform's amount plus the VAT and ISD paid
 * here, from the card statement, with the total. The total uses the shared
 * function; nothing is computed here but the preview.
 */
export function PurchasePaymentFields({
  idPrefix,
  defaults,
}: {
  idPrefix: string;
  defaults: {
    paid_on: string;
    covers_from: string;
    covers_to: string;
    quantity: number;
    amount: string;
  };
}) {
  const [amounts, setAmounts] = useState({
    amount: defaults.amount,
    vat_amount: "",
    isd_amount: "",
  });
  const parsed = {
    amount: amountOf(amounts.amount),
    vat_amount: amountOf(amounts.vat_amount),
    isd_amount: amountOf(amounts.isd_amount),
  };
  const total =
    parsed.amount !== null &&
    parsed.vat_amount !== null &&
    parsed.isd_amount !== null
      ? formatCents(
          paymentTotalCents({
            amount: parsed.amount,
            vat_amount: parsed.vat_amount,
            isd_amount: parsed.isd_amount,
          }),
        )
      : "—";

  const money = (
    name: "amount" | "vat_amount" | "isd_amount",
    label: string,
    hint?: string,
  ) => (
    <FormField
      label={label}
      name={name}
      id={`${idPrefix}-${name}`}
      inputMode="decimal"
      required={name === "amount"}
      value={amounts[name]}
      onChange={(event) =>
        setAmounts({ ...amounts, [name]: event.target.value })
      }
      hint={hint}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <FormField
          label="Fecha de pago"
          name="paid_on"
          id={`${idPrefix}-paid-on`}
          type="date"
          required
          defaultValue={defaults.paid_on}
        />
        <FormField
          label="Cubre desde"
          name="covers_from"
          id={`${idPrefix}-covers-from`}
          type="date"
          required
          defaultValue={defaults.covers_from}
        />
        <FormField
          label="Cubre hasta"
          name="covers_to"
          id={`${idPrefix}-covers-to`}
          type="date"
          defaultValue={defaults.covers_to}
          hint="Vacío: no vence."
        />
        <FormField
          label="Cantidad pagada"
          name="paid_quantity"
          id={`${idPrefix}-quantity`}
          type="number"
          min={1}
          max={10_000}
          required
          defaultValue={defaults.quantity}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {money("amount", "Monto de la plataforma")}
        {money("vat_amount", "IVA pagado aquí")}
        {money(
          "isd_amount",
          "ISD pagado aquí",
          "Del estado de cuenta de tu tarjeta. 0 si no aplica.",
        )}
        <p
          className="flex min-h-12 flex-col justify-start pt-1"
          aria-live="polite"
        >
          <span className="font-medium">Total pagado</span>
          <span className="text-h4 tabular-nums">{total}</span>
        </p>
      </div>
      <FormField
        label="Notas"
        name="payment_notes"
        id={`${idPrefix}-notes`}
        maxLength={1000}
      />
    </div>
  );
}
