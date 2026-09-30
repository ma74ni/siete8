import type { Metadata } from "next";

import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";
import { pageMetadata } from "@/lib/metadata";

// Texts from docs/COPY.md §6 and §7 (SEO). Portraits join once they exist.

const title = "Nosotros | Siete8";
const description =
  "Siete8 es un estudio tecnológico de Quito fundado en 2020 por Diego Paredes y Oswaldo Sotomayor. Tecnología para negocios pequeños y emprendedores.";

export const metadata: Metadata = pageMetadata({
  title,
  description,
  path: "/nosotros",
});

const founders = [
  {
    name: "Diego Paredes",
    text: "Cofundador, el 7. Desarrollador full-stack con más de 13 años de experiencia en sistemas web e integraciones con servicios del Ecuador.",
  },
  {
    name: "Oswaldo Sotomayor",
    text: "Cofundador, el 8. Especialista en inteligencia de negocio: datos, tableros y reportes que ayudan a decidir.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Floor>
        <div className="flex flex-col gap-6">
          <h1>Tecnología para los negocios que nadie atiende</h1>
          <p>
            Diego Paredes y Oswaldo Sotomayor llevan años trabajando juntos. Han
            emprendido, han tropezado y han sacado adelante proyectos grandes,
            aprendiendo a juntar lo mejor de cada uno. En julio de 2020 fundaron
            Siete8 con una idea simple: casi todas las soluciones tecnológicas
            están pensadas para empresas grandes o para quien puede pagarlas
            caro. La tienda del barrio, el emprendedor que recién empieza a
            facturar, el negocio pequeño, casi nunca tienen a alguien que los
            atienda. Siete8 existe para ellos.
          </p>
        </div>
      </Floor>
      <Floor alt>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h2>El 7 y el 8</h2>
            <p>
              Diego es el 7: creativo, arriesgado, el que propone lo nuevo.
              Oswaldo es el 8: cuidadoso, metódico, el que se asegura de que
              todo funcione. El logo lo escribe en el idioma de las
              computadoras: las tres barras son el 7 en binario (111) y el
              bloque de la derecha es el 8 (1000), montados juntos como un
              servidor.
            </p>
          </div>
          <ul className="grid gap-10 md:grid-cols-2">
            {founders.map((founder) => (
              <li key={founder.name} className="flex flex-col gap-2">
                <h3>{founder.name}</h3>
                <p>{founder.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Floor>
      <Floor>
        <p className="text-h4">
          Creemos que a un negocio pequeño también le puede ir muy bien con la
          tecnología correcta.
        </p>
      </Floor>
      <Closing />
    </>
  );
}
