import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/sitio/button";
import { Faq } from "@/components/sitio/faq";
import { FormField } from "@/components/sitio/form-field";
import { PlanTable, type PlanRow } from "@/components/sitio/plan-table";
import { CategoryDivider } from "@/components/sitio/motif/category-divider";
import { HeroMotif } from "@/components/sitio/motif/hero-motif";
import { ReadingProgress } from "@/components/sitio/motif/reading-progress";
import { Tabs } from "@/components/sitio/tabs";
import { TextLink } from "@/components/sitio/text-link";
import { serverEnv } from "@/env/server";

import { Replay } from "./replay";

/*
 * Component showcase (E2-02). Visible with `pnpm dev` and in Netlify deploy
 * previews; 404 in production. Section labels are for developers only; the
 * sample content comes from docs/COPY.md §4 and the seeded signature plans.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const request = { label: "Solicitar", href: "#solicitar" };

// Prices without VAT, as in supabase/seed.sql.
const natural: PlanRow[] = [
  ["7 días", 6.99, "para un trámite puntual"],
  ["30 días", 9.99, "para un trámite puntual"],
  ["1 año", 17.99],
  ["2 años", 26.99],
  ["3 años", 36.99],
  ["4 años", 47.99],
  ["5 años", 54.99],
].map(([name, price, detail]) => ({
  id: `natural-${name}`,
  name: name as string,
  detail: detail as string | undefined,
  priceWithoutVat: price as number,
  vatRate: 0.15,
  recommended: name === "1 año",
  action: request,
}));

const legal: PlanRow[] = [
  ["1 año", 20.99],
  ["2 años", 29.99],
  ["3 años", 39.99],
  ["4 años", 50.99],
  ["5 años", 57.99],
].map(([name, price]) => ({
  id: `legal-${name}`,
  name: name as string,
  priceWithoutVat: price as number,
  vatRate: 0.15,
  recommended: name === "1 año",
  action: request,
}));

const questions = [
  {
    question: "¿Para qué me sirve la firma electrónica?",
    answer:
      "Para emitir facturas electrónicas en el SRI, firmar contratos y documentos digitales, y hacer trámites en línea con entidades públicas y privadas. Tiene la misma validez legal que tu firma manuscrita.",
  },
  {
    question: "¿En qué formato la recibo?",
    answer:
      "Como archivo .p12, listo para instalar en tu computadora o cargar en tu sistema de facturación.",
  },
  {
    question: "¿En qué horario atienden?",
    answer:
      "De 07:00 a 20:00. Si escribes fuera de ese horario, atendemos tu solicitud desde las 07:00 del día siguiente.",
  },
  {
    question: "¿Qué plan me conviene?",
    answer:
      "Si la usas para facturar todo el año, el de 1 año o más. Los de 7 y 30 días sirven para un trámite puntual.",
  },
  {
    question: "¿Me ayudan a instalarla?",
    answer:
      "Sí, si lo necesitas. Te ayudamos a instalarla en el sistema donde facturas o firmas.",
  },
];

function Section({
  title,
  surface,
  children,
}: {
  title: string;
  surface?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={surface ? "bg-surface" : undefined}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 lg:px-12">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function DevUiPage() {
  if (serverEnv.CONTEXT === "production") notFound();

  return (
    <main>
      <ReadingProgress />

      <Section title="Motivo del hero">
        <Replay>
          <HeroMotif
            categories={[
              "Presencia digital",
              "Trámites y cumplimiento",
              "Desarrollo y datos",
            ]}
            className="w-full lg:w-1/2"
          />
        </Replay>
      </Section>

      <Section title="Separador de categorías" surface>
        {[
          "Presencia digital",
          "Trámites y cumplimiento",
          "Desarrollo y datos",
        ].map((category) => (
          <div key={category} className="flex items-center gap-3">
            <CategoryDivider />
            <h3>{category}</h3>
          </div>
        ))}
      </Section>

      <Section title="Botones">
        <div className="flex flex-wrap gap-4">
          <Button href="#whatsapp">Escríbenos por WhatsApp</Button>
          <Button href="#planes" variant="secondary">
            Ver planes
          </Button>
          <Button disabled>Solicitar por WhatsApp</Button>
        </div>
      </Section>

      <Section title="Enlace">
        <p className="max-w-[68ch]">
          Tu firma para facturar en el SRI, firmar contratos y hacer trámites en
          línea. <TextLink href="#planes">Ver planes y requisitos</TextLink>
        </p>
      </Section>

      <Section title="Pestañas y tabla de planes" surface>
        <div className="flex flex-col gap-1">
          <h3>Planes</h3>
          <p>Todos los precios incluyen IVA.</p>
        </div>
        <Tabs
          label="Planes"
          tabs={[
            {
              id: "natural",
              label: "Persona natural",
              content: (
                <PlanTable
                  label="Persona natural"
                  plans={natural}
                  recommendedLabel="recomendado para facturar"
                  vatNote="incluye IVA"
                />
              ),
            },
            {
              id: "legal",
              label: "Representante legal",
              content: (
                <div className="flex flex-col gap-4">
                  <PlanTable
                    label="Representante legal"
                    plans={legal}
                    recommendedLabel="recomendado para facturar"
                    vatNote="incluye IVA"
                  />
                  <p>Los planes de 7 y 30 días no están disponibles.</p>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Preguntas frecuentes">
        <Faq items={questions} />
      </Section>

      <Section title="Campos de formulario" surface>
        <form className="flex max-w-[34rem] flex-col gap-6">
          <FormField
            label="[COPY PENDIENTE: etiqueta de nombre]"
            name="name"
            autoComplete="name"
          />
          <FormField
            label="[COPY PENDIENTE: etiqueta de celular]"
            name="phone"
            type="tel"
            autoComplete="tel"
            hint="[COPY PENDIENTE: ayuda del celular]"
          />
          <FormField
            label="[COPY PENDIENTE: etiqueta de correo]"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue="correo-invalido"
            error="[COPY PENDIENTE: error de correo inválido]"
          />
          <FormField
            label="[COPY PENDIENTE: etiqueta de mensaje]"
            name="message"
            multiline
          />
        </form>
      </Section>
    </main>
  );
}
