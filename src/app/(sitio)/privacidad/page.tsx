import type { Metadata } from "next";

import { LegalPage } from "@/components/sitio/legal-page";
import { pageMetadata } from "@/lib/metadata";

// Texts from docs/COPY.md §7.1 (draft pending approval, COPY §5).

const title = "Política de privacidad | Siete8";
const description =
  "Cómo Siete8 recoge, usa y protege tus datos personales, y cómo ejercer tus derechos.";

export const metadata: Metadata = pageMetadata({
  title,
  description,
  path: "/privacidad",
});

const sections = [
  {
    heading: "Quién trata tus datos",
    body: "El responsable del tratamiento es Diego Paredes, RUC 1715758502001, con domicilio en Quito, Ecuador, que opera con el nombre comercial Siete8. Para cualquier tema sobre tus datos, escríbenos a hola@siete8.com.",
  },
  {
    heading: "Qué datos recogemos",
    body: "Cuando nos escribes por WhatsApp, correo o teléfono, o llenas un formulario del sitio, recogemos tu nombre, teléfono, correo, el servicio que te interesa y el origen de tu visita (por ejemplo, desde qué anuncio o red social llegaste).",
  },
  {
    heading: "Documentos de identidad",
    body: "El sitio no pide ni guarda documentos de identidad. Para tramitar una firma electrónica, nos envías tus requisitos por WhatsApp, y los usamos solo para tramitar esa firma con la entidad que la emite.",
  },
  {
    heading: "Para qué los usamos",
    body: "Para responder tus solicitudes, preparar y enviarte propuestas comerciales, y prestarte el servicio que contrates. No vendemos tus datos.",
  },
  {
    heading: "Por qué podemos usarlos",
    body: "Usamos tus datos porque nos das tu consentimiento al escribirnos o al enviar un formulario, y porque los necesitamos para preparar o cumplir el servicio que nos pides.",
  },
  {
    heading: "Con quién los compartimos",
    body: "Solo con los proveedores que necesitamos para operar: el alojamiento del sitio y de la base de datos, el correo y WhatsApp. Algunos de ellos guardan la información en servidores fuera del Ecuador. Para una firma electrónica, compartimos tus requisitos con la entidad que la emite.",
  },
  {
    heading: "Cuánto tiempo los guardamos",
    body: "Mientras sean necesarios para atender tu solicitud o prestarte el servicio, y después el tiempo que exijan las obligaciones legales y tributarias.",
  },
  {
    heading: "Tus derechos",
    body: "Puedes pedirnos acceder a tus datos, corregirlos o actualizarlos, eliminarlos, oponerte a su uso, suspender su tratamiento o recibirlos en un formato que puedas llevar a otro proveedor. Escríbenos a hola@siete8.com. Si no te respondemos o no estás de acuerdo con la respuesta, puedes presentar un reclamo ante la Superintendencia de Protección de Datos Personales.",
  },
  {
    heading: "Cookies",
    body: "El sitio solo usa las cookies necesarias para funcionar. Si más adelante sumamos herramientas de medición, te pediremos permiso antes de activarlas.",
  },
  {
    heading: "Cambios a esta política",
    body: "Si cambiamos esta política, publicamos la versión nueva en esta página con su fecha.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      updated="Última actualización: 29 de septiembre de 2026."
      sections={sections}
    />
  );
}
