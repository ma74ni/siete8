import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/sitio/button";
import { Floor } from "@/components/sitio/floor";
import { CategoryDivider } from "@/components/sitio/motif/category-divider";
import { HeroMotif } from "@/components/sitio/motif/hero-motif";
import { PlanTable } from "@/components/sitio/plan-table";
import { ProjectCard } from "@/components/sitio/project-card";
import { featuredPlans, lowestPriceCents } from "@/lib/plans";
import { formatCents } from "@/lib/price";
import {
  generalMessage,
  signaturePlanMessage,
  whatsappUrl,
} from "@/lib/whatsapp";
import { getLatestPost } from "@/server/blog";
import { getServiceMenu, getServicePlans } from "@/server/catalog";
import { getFeaturedProjects } from "@/server/portfolio";

// Texts from docs/COPY.md §3.

const title =
  "Siete8 | Sitios web, hosting, firma electrónica y facturación en Quito";
const description =
  "Estudio tecnológico en Quito. Sitios web, hosting, correo corporativo, firma electrónica y facturación electrónica para personas y pymes. Escríbenos por WhatsApp.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/" },
};

const steps = [
  {
    title: "Conversamos.",
    text: "Nos cuentas qué necesitas por WhatsApp o en una llamada. Sin formularios largos.",
  },
  {
    title: "Te proponemos.",
    text: "Recibes una propuesta con alcance, precio y plazo claros antes de empezar.",
  },
  {
    title: "Construimos y te acompañamos.",
    text: "Entregamos, te enseñamos a usarlo y seguimos disponibles cuando algo falla.",
  },
];

export default async function Home() {
  const [signature, categories, projects, post] = await Promise.all([
    getServicePlans("firma-electronica"),
    getServiceMenu(),
    getFeaturedProjects(),
    getLatestPost(),
  ]);

  // Sections without content (no projects or articles yet) are left out; the
  // floors keep alternating over the ones that remain.
  const sections: ReactNode[] = [
    <Hero key="hero" />,
    signature && <FeaturedService key="featured" service={signature} />,
    categories.length > 0 && (
      <Categories key="categories" categories={categories} />
    ),
    projects.length > 0 && <Projects key="projects" projects={projects} />,
    <Steps key="steps" />,
    post && <LatestPost key="post" post={post} />,
  ].filter(Boolean);

  return sections.map((section, index) => (
    <Floor
      key={index}
      alt={index % 2 === 1}
      className={index === 0 ? "lg:py-24" : undefined}
    >
      {section}
    </Floor>
  ));
}

function Hero() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
      <HeroMotif
        categories={[
          "Presencia digital",
          "Trámites y cumplimiento",
          "Desarrollo y datos",
        ]}
        className="lg:order-2"
      />
      <div className="flex flex-col items-start gap-6">
        <h1>
          Tu web, tu correo, tu firma y tus facturas, resueltos por un mismo
          equipo.
        </h1>
        <p className="max-w-[68ch]">
          Somos Siete8, un estudio tecnológico de Quito. Diseñamos sitios y
          sistemas, administramos tu hosting y tu correo, y te ayudamos con la
          firma electrónica y la facturación.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button href={whatsappUrl(generalMessage())}>
            Escríbenos por WhatsApp
          </Button>
          <Button href="/servicios" variant="secondary">
            Ver servicios
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeaturedService({
  service,
}: {
  service: NonNullable<Awaited<ReturnType<typeof getServicePlans>>>;
}) {
  const natural = service.plans.filter((plan) => plan.holderType === "natural");
  const legal = service.plans.filter(
    (plan) => plan.holderType === "legal_entity",
  );
  const legalFrom = lowestPriceCents(legal);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <div className="flex flex-col items-start gap-6">
        <h2>Tu firma electrónica, en minutos y sin salir de tu negocio</h2>
        <p className="max-w-[68ch]">
          Te la entregamos entre 5 y 10 minutos después de recibir tus
          requisitos completos, de 07:00 a 20:00. Sirve para facturar en el SRI,
          firmar contratos y hacer trámites en línea.
        </p>
        <Button href={`/servicios/${service.slug}`} variant="secondary">
          Ver planes y requisitos
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        <h3>Persona natural</h3>
        <PlanTable
          label="Persona natural"
          recommendedLabel="recomendado para facturar"
          vatNote="incluye IVA"
          plans={featuredPlans(natural).map((plan) => ({
            ...plan,
            action: {
              label: "Solicitar",
              href: whatsappUrl(
                signaturePlanMessage({
                  holder: "natural",
                  validity: plan.name,
                  priceWithoutVat: plan.priceWithoutVat,
                  vatRate: plan.vatRate,
                }),
              ),
            },
          }))}
        />
        {legalFrom !== null && (
          <p>
            También para representante legal, desde {formatCents(legalFrom)}.
          </p>
        )}
      </div>
    </div>
  );
}

function Categories({
  categories,
}: {
  categories: Awaited<ReturnType<typeof getServiceMenu>>;
}) {
  return (
    <div className="flex flex-col gap-10">
      <h2>Qué resolvemos</h2>
      <ul className="grid gap-10 md:grid-cols-2">
        {categories.map((category) => (
          <li key={category.slug} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <CategoryDivider />
              <h3>{category.name}</h3>
            </div>
            {category.description && <p>{category.description}</p>}
            <ul className="flex flex-col">
              {category.services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/servicios/${service.slug}`}
                    className="flex min-h-11 items-center"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Projects({
  projects,
}: {
  projects: Awaited<ReturnType<typeof getFeaturedProjects>>;
}) {
  return (
    <div className="flex flex-col items-start gap-10">
      <h2>Proyectos</h2>
      <div className="grid w-full gap-10 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
      <Button href="/proyectos" variant="secondary">
        Ver todos los proyectos
      </Button>
    </div>
  );
}

function Steps() {
  return (
    <div className="flex flex-col gap-10">
      <h2>Cómo trabajamos</h2>
      <ol className="grid gap-10 lg:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3">
            <span aria-hidden className="text-display leading-none font-bold">
              {index + 1}
            </span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LatestPost({
  post,
}: {
  post: NonNullable<Awaited<ReturnType<typeof getLatestPost>>>;
}) {
  return (
    <div className="flex flex-col gap-10">
      <h2>Del blog</h2>
      <article className="flex max-w-[68ch] flex-col gap-3">
        <h3>
          <Link href={`/blog/${post.slug}`} className="text-fg">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p>{post.excerpt}</p>}
      </article>
    </div>
  );
}
