/**
 * The only place where VAT is applied. Prices are stored without VAT
 * (`price_without_vat`) next to `vat_rate`; the site always shows the total.
 * Everything is computed in integer cents to avoid floating point errors.
 */

/** Total with VAT, in cents: round(price × (1 + rate), 2), half up. */
export function priceWithVatCents(
  priceWithoutVat: number,
  vatRate: number,
): number {
  if (!Number.isFinite(priceWithoutVat) || priceWithoutVat < 0) {
    throw new RangeError(`Invalid price: ${priceWithoutVat}`);
  }
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate >= 1) {
    throw new RangeError(`Invalid VAT rate: ${vatRate}`);
  }
  const cents = Math.round(priceWithoutVat * 100);
  // Rate in hundredths of a percent: 0.15 → 1500.
  const basisPoints = Math.round(vatRate * 10_000);
  return Math.floor((cents * (10_000 + basisPoints) + 5_000) / 10_000);
}

/** Formats cents as shown on the site: `$20,69`, `$1.234,50`. */
export function formatCents(cents: number): string {
  const units = Math.floor(cents / 100).toString();
  const decimals = (cents % 100).toString().padStart(2, "0");
  const grouped = units.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${grouped},${decimals}`;
}

/** Price with VAT, formatted: 17.99 at 15 % → `$20,69`. */
export function formatPriceWithVat(
  priceWithoutVat: number,
  vatRate: number,
): string {
  return formatCents(priceWithVatCents(priceWithoutVat, vatRate));
}
