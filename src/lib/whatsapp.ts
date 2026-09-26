import { formatPriceWithVat } from "@/lib/price";

/** Commercial WhatsApp, 0961128233, in international format for wa.me. */
export const WHATSAPP_NUMBER = "593961128233";

/** wa.me link that opens a chat with Siete8 and the message already typed. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Prefilled messages, verbatim from docs/COPY.md §2.
const INTRO = "Hola, vengo del sitio de Siete8.";

/** General button: the visitor completes the sentence. */
export function generalMessage(): string {
  return `${INTRO} Quiero información sobre:`;
}

/** Button on a service page. */
export function serviceMessage(service: string): string {
  return `${INTRO} Quiero información sobre ${service}.`;
}

const HOLDER_LABELS = {
  natural: "persona natural",
  legal_entity: "representante legal",
} as const;

/** "Solicitar" on a row of the signature plans. */
export function signaturePlanMessage(plan: {
  holder: keyof typeof HOLDER_LABELS;
  /** Validity as the plan is named: "7 días", "1 año". */
  validity: string;
  priceWithoutVat: number;
  vatRate: number;
}): string {
  const price = formatPriceWithVat(plan.priceWithoutVat, plan.vatRate);
  return `${INTRO} Quiero una firma electrónica de ${HOLDER_LABELS[plan.holder]} con vigencia de ${plan.validity} (${price} con IVA).`;
}
