import { Button } from "@/components/sitio/button";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";

type ClosingProps = {
  title?: string;
  cta?: { label: string; href: string };
};

/**
 * Closing call to action at the end of every public page, on the `ink` floor
 * right above the footer (COPY §2). The signature page uses its own title and
 * button ("¿Listo para sacar tu firma?").
 */
export function Closing({
  title = "¿Qué necesitas resolver?",
  cta = {
    label: "Escríbenos por WhatsApp",
    href: whatsappUrl(generalMessage()),
  },
}: ClosingProps) {
  return (
    <section className="on-ink">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-5 pt-16 pb-8 lg:px-12 lg:pt-[120px]">
        <h2>{title}</h2>
        <Button href={cta.href}>{cta.label}</Button>
      </div>
    </section>
  );
}
