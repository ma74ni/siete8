import { Button } from "@/components/sitio/button";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";
import { getSiteSettings } from "@/server/site-settings";

type ClosingProps = {
  title?: string;
  cta?: { label: string; href: string };
};

/**
 * Closing call to action at the end of every public page, on the `ink` floor
 * right above the footer (COPY §2). The signature page uses its own title and
 * button ("¿Listo para sacar tu firma?").
 */
export async function Closing({
  title = "¿Qué necesitas resolver?",
  cta,
}: ClosingProps) {
  const button = cta ?? {
    label: "Escríbenos por WhatsApp",
    href: whatsappUrl(
      generalMessage(),
      (await getSiteSettings()).whatsapp.waMe,
    ),
  };
  return (
    <section className="on-ink">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-5 pt-14 pb-10 lg:px-12 lg:pt-20 lg:pb-12">
        <h2>{title}</h2>
        <Button href={button.href}>{button.label}</Button>
      </div>
    </section>
  );
}
