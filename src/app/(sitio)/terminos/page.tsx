import type { Metadata } from "next";

import { LegalPage } from "@/components/sitio/legal-page";
import { pageMetadata } from "@/lib/metadata";

// Texts from docs/COPY.md §7.2 (draft pending approval, COPY §5).

const title = "Términos de uso | Siete8";
const description =
  "Condiciones de uso del sitio y de los servicios de Siete8: precios, firma electrónica y proyectos a medida.";

export const metadata: Metadata = pageMetadata({
  title,
  description,
  path: "/terminos",
});

const sections = [
  {
    heading: "Quiénes somos",
    body: "Siete8 es el nombre comercial de Diego Paredes, RUC 1715758502001, con domicilio en Quito, Ecuador. Al usar este sitio aceptas estos términos.",
  },
  {
    heading: "Precios",
    body: "Los precios están en dólares de los Estados Unidos e incluyen IVA. Pueden cambiar sin aviso previo; se respeta el precio publicado al momento de tu solicitud.",
  },
  {
    heading: "Firma electrónica",
    body: "La emisión depende de que tus requisitos estén completos y sean válidos. La entregamos entre 5 y 10 minutos después de validar tus datos, de 07:00 a 20:00. Eres responsable de que tus datos sean verdaderos y de guardar tu archivo .p12 y su clave: no los compartas con nadie.",
  },
  {
    heading: "Proyectos a medida",
    body: "El alcance, el precio y el plazo de cada sitio, sistema o servicio a medida se fijan en su propuesta, que aceptas antes de empezar.",
  },
  {
    heading: "Uso del sitio",
    body: "El contenido, el logo y el diseño de este sitio son de Siete8. No los copies ni los uses sin permiso.",
  },
  {
    heading: "Ley aplicable",
    body: "Estos términos se rigen por las leyes del Ecuador. Cualquier controversia se resuelve ante los jueces de Quito.",
  },
  {
    heading: "Contacto",
    body: "Escríbenos a hola@siete8.com o por WhatsApp al 0961128233.",
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos de uso"
      updated="Última actualización: 29 de septiembre de 2026."
      sections={sections}
    />
  );
}
