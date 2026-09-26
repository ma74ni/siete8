import { WhatsAppIcon } from "@/components/sitio/layout/whatsapp-icon";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";

/**
 * Floating WhatsApp button on every page (RF-PUB-08, DESIGN §7): a 56 px
 * circle in the bottom-right corner that stays clear of the device's safe
 * area. Inverted colors (`fg` on `bg`) keep it visible in both schemes.
 */
export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl(generalMessage())}
      aria-label="Escribir por WhatsApp"
      className="fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-fg text-bg no-underline transition-colors duration-150 ease-out"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
