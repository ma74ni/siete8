"use client";

import { useState } from "react";

import { Input, Label } from "@/components/form/controls";
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
  previewLabel = "En el sitio",
}: {
  idPrefix: string;
  price: number;
  vatRate: number;
  /** "Con IVA" where the total is not what the site shows (clients). */
  previewLabel?: string;
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

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex w-32 flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-price`}>Precio sin IVA</Label>
        <Input
          id={`${idPrefix}-price`}
          name="price_without_vat"
          inputMode="decimal"
          required
          numeric
          value={priceText}
          onChange={(event) => setPriceText(event.target.value)}
        />
      </div>
      <div className="flex w-20 flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-vat`}>IVA %</Label>
        <Input
          id={`${idPrefix}-vat`}
          name="vat_rate"
          inputMode="decimal"
          required
          numeric
          value={vatText}
          onChange={(event) => setVatText(event.target.value)}
        />
      </div>
      <p className="flex min-h-12 flex-col justify-center" aria-live="polite">
        <span className="text-small">{previewLabel}</span>
        <span className="font-medium tabular-nums">{preview}</span>
      </p>
    </div>
  );
}
