import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { CheckboxField } from "@/components/admin/checkbox-field";
import { DataTable } from "@/components/admin/data-table";
import { Disclosure } from "@/components/admin/disclosure";
import { EmptyState } from "@/components/admin/empty-state";
import { SelectField } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { StatusText } from "@/components/admin/status-text";
import { Input, Label, Radio } from "@/components/form/controls";
import { Button } from "@/components/sitio/button";
import { Faq } from "@/components/sitio/faq";
import { FormField } from "@/components/sitio/form-field";
import { PlanGrid } from "@/components/sitio/plan-grid";
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
  ["30 días", 7.99, "para un trámite puntual"],
  ["1 año", 17.99],
  ["2 años", 26.99],
  ["3 años", 36.99],
  ["4 años", 45.99],
  ["5 años", 53.99],
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
  ["1 año", 17.99],
  ["2 años", 26.99],
  ["3 años", 36.99],
  ["4 años", 45.99],
  ["5 años", 53.99],
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

/** Made-up rows for the panel table (SRS 3.9: never real clients). */
const sampleDue = [
  {
    id: "1",
    client: "Ferretería Andes",
    service: "Hosting, andes.test",
    expiry: "Venció el 1 de octubre de 2026",
    expired: true,
    payment: "Debe $20,69",
    price: "$20,69",
    renews: true,
  },
  {
    id: "2",
    client: "Heladería Polar",
    service: "Firma electrónica",
    expiry: "Vence el 5 de noviembre de 2026",
    expired: false,
    payment: "Pagado",
    price: "$13,80",
    renews: false,
  },
];

const noRows: typeof sampleDue = [];

export default function DevUiPage() {
  if (serverEnv.CONTEXT === "production") notFound();

  return (
    <div>
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

      <Section title="Pestañas, tabla y grilla de planes" surface>
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
        <h3>Grilla de planes</h3>
        <PlanGrid
          label="Persona natural"
          plans={natural}
          recommendedLabel="recomendado para facturar"
          vatNote="incluye IVA"
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

      {/* E13-01: the form atoms (src/components/form/controls.tsx) and the
          fields built from them, in each state. Texts from COPY §13. */}
      <Section title="Controles de formulario">
        <form className="flex max-w-[34rem] flex-col gap-6">
          <SelectField
            label="Servicio"
            id="ui-select"
            name="service"
            defaultValue=""
            hint="Incluye los servicios ocultos."
          >
            <option value="">Ninguno</option>
            <option value="firma">Firma electrónica</option>
          </SelectField>
          <SelectField
            label="Cliente y servicio"
            id="ui-select-error"
            name="client_service"
            defaultValue=""
            error="Elige el cliente y servicio."
          >
            <option value="">Elige uno</option>
          </SelectField>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex w-32 flex-col gap-1.5">
              <Label htmlFor="ui-numeric">Precio sin IVA</Label>
              <Input id="ui-numeric" defaultValue="17,99" numeric />
            </div>
            <div className="flex w-24 flex-col gap-1.5">
              <Label htmlFor="ui-disabled">Cantidad</Label>
              <Input id="ui-disabled" type="number" disabled numeric />
            </div>
          </div>
          <CheckboxField
            label="La persona aceptó que la contactemos."
            name="consent"
            id="ui-checkbox"
          />
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 font-medium">Se carga a</legend>
            {[
              ["client", "Un cliente"],
              ["services", "Servicios del catálogo"],
            ].map(([value, label]) => (
              <label
                key={value}
                htmlFor={`ui-radio-${value}`}
                className="flex min-h-11 items-center gap-3"
              >
                <Radio
                  id={`ui-radio-${value}`}
                  name="charge_to"
                  value={value}
                  defaultChecked={value === "client"}
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        </form>
      </Section>

      {/* E13-02: panel organisms (DESIGN §12.1). Made-up rows; texts from
          COPY §13. */}
      <Section title="Componentes del panel" surface>
        <div className="flex flex-col gap-10">
          <PageHeader
            title="Clientes"
            intro="Lo que tiene contratado cada cliente y cuándo vence."
            back={{ href: "/admin/clientes", label: "Volver a clientes" }}
            actions={
              <>
                <Button href="/admin/clientes/nuevo">Nuevo cliente</Button>
                <Button href="/admin/clientes/importar" variant="secondary">
                  Importar desde CSV
                </Button>
              </>
            }
          />
          <DataTable
            rows={sampleDue}
            columns={[
              { header: "Cliente", cell: (row) => row.client, rowHeader: true },
              { header: "Servicio", cell: (row) => row.service },
              {
                header: "Vence",
                cell: (row) => (
                  <StatusText tone={row.expired ? "alert" : "default"}>
                    {row.expiry}
                  </StatusText>
                ),
              },
              { header: "Pago", cell: (row) => row.payment },
              {
                header: "Precio con IVA",
                cell: (row) => row.price,
                numeric: true,
              },
            ]}
            rowKey={(row) => row.id}
            label="Tus clientes"
            empty="Ningún servicio de tus clientes vence en los próximos 30 días."
            details={(row) =>
              row.renews ? (
                <Disclosure summary="Renovar" variant="action">
                  <p>Fecha de venta, Desde, Hasta, Precio y Costo.</p>
                </Disclosure>
              ) : null
            }
          />
          <DataTable
            rows={noRows}
            columns={[{ header: "Cliente", cell: (row) => row.client }]}
            rowKey={(row) => row.id}
            label="Por cobrar"
            empty="Nadie te debe nada."
          />
          <EmptyState
            action={<Button href="/admin/clientes/nuevo">Nuevo cliente</Button>}
          >
            Todavía no hay clientes.
          </EmptyState>
          <Disclosure summary="Agregar servicio">
            <p>El formulario del servicio va aquí.</p>
          </Disclosure>
          <Disclosure summary="Registrar abono" variant="inline">
            <p>Fecha, Monto con IVA, Forma de pago y Notas.</p>
          </Disclosure>
        </div>
      </Section>
    </div>
  );
}
