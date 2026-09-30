"use client";

import { useState } from "react";

import { money } from "@/lib/admin-forms";
import { formatPriceWithVat } from "@/lib/price";

/**
 * Price without VAT plus the VAT rate, with the total the site will show
 * (E4-03: "se muestra la vista previa con IVA"). The total comes from the
 * shared price function, never computed here.
 */
export function PriceField({
  idPrefix,
  price,
  vatRate,
}: {
  idPrefix: string;
  price: number;
  vatRate: number;
}) {
  const [priceText, setPriceText] = useState(
    price.toFixed(2).replace(".", ","),
  );
  const [vatText, setVatText] = useState(
    String(Math.round(vatRate * 10_000) / 100).replace(".", ","),
  );

  const parsedPrice = money.safeParse(priceText);
  const vat = Number(vatText.replace(",", "."));
  const preview =
    parsedPrice.success && Number.isFinite(vat) && vat >= 0 && vat < 100
      ? formatPriceWithVat(parsedPrice.data, vat / 100)
      : "—";

  const control =
    "min-h-12 w-full rounded-control border border-field-border bg-bg px-3 text-fg tabular-nums";

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex w-32 flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-price`} className="font-medium">
          Precio sin IVA
        </label>
        <input
          id={`${idPrefix}-price`}
          name="price_without_vat"
          inputMode="decimal"
          required
          value={priceText}
          onChange={(event) => setPriceText(event.target.value)}
          className={control}
        />
      </div>
      <div className="flex w-20 flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-vat`} className="font-medium">
          IVA %
        </label>
        <input
          id={`${idPrefix}-vat`}
          name="vat_rate"
          inputMode="decimal"
          required
          value={vatText}
          onChange={(event) => setVatText(event.target.value)}
          className={control}
        />
      </div>
      <p className="flex min-h-12 flex-col justify-center" aria-live="polite">
        <span className="text-small">En el sitio</span>
        <span className="font-medium tabular-nums">{preview}</span>
      </p>
    </div>
  );
}
