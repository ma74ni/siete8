import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/sitio/button";
import { Closing } from "@/components/sitio/closing";
import { Faq } from "@/components/sitio/faq";
import { Floor } from "@/components/sitio/floor";
import { JsonLd } from "@/components/sitio/json-ld";
import { Markdown } from "@/components/sitio/markdown";
import { HeroMotif } from "@/components/sitio/motif/hero-motif";
import { PlanGrid } from "@/components/sitio/plan-grid";
import { ProjectCard } from "@/components/sitio/project-card";
import type { PlanRow } from "@/components/sitio/plan-table";
import { Tabs } from "@/components/sitio/tabs";
import { clientEnv } from "@/env/client";
import { pageMetadata } from "@/lib/metadata";
import { lowestPriceCents } from "@/lib/plans";
import { formatCents } from "@/lib/price";
import {
  HOLDER_LABELS,
  holderTypes,
  requirementsByHolder,
} from "@/lib/service-page";
import { serviceGraph } from "@/lib/structured-data";
import {
  serviceMessage,
  signaturePlanMessage,
  whatsappUrl,
} from "@/lib/whatsapp";
import {
  getServicePage,
  getVisibleServiceSlugs,
  type ServicePage,
} from "@/server/catalog";
import { getProjectsForService } from "@/server/portfolio";

// Fixed texts from docs/COPY.md §2 and §4; everything else comes from the
// service in the database, so the panel can edit it.

export async function generateStaticParams() {
  const slugs = await getVisibleServiceSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/servicios/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServicePage(slug);
  if (!service) return {};
  const title = service.seoTitle ?? `${service.name} | Siete8`;
  const description = service.seoDescription ?? service.summary ?? undefined;
  const url = `/servicios/${service.slug}`;
  return pageMetadata({ title, description, path: url });
}

/** Page of a service (RF-PUB-03..05). Hidden or unknown services: 404. */
export default async function ServicePageRoute({
  params,
}: PageProps<"/servicios/[slug]">) {
  const { slug } = await params;
  const service = await getServicePage(slug);
  if (!service) notFound();
  const projects = await getProjectsForService(service.slug);

  const sections = [
    service.body && (
      // Who it is for, what it includes and the timeline (E6-02).
      <Markdown key="body" variant="checklist">
        {service.body}
      </Markdown>
    ),
    service.steps.length > 0 && (
      <Steps
        key="steps"
        // COPY §4 for the signature ("la" firma); §16 for the rest.
        title={
          service.slug === "firma-electronica"
            ? "Así la obtienes"
            : "Cómo funciona"
        }
        steps={service.steps}
      />
    ),
    service.plans.length > 0 && <Plans key="plans" service={service} />,
    requirementsByHolder(service.plans).length > 0 && (
      <Requirements key="requirements" service={service} />
    ),
    service.faqs.length > 0 && <Questions key="faq" faqs={service.faqs} />,
    projects.length > 0 && (
      <RelatedProjects key="projects" projects={projects} />
    ),
    service.crossSell && (
      <CrossSell key="cross-sell" crossSell={service.crossSell} />
    ),
  ].filter(Boolean);

  const request = whatsappUrl(serviceMessage(service.name));

  return (
    <>
      <JsonLd
        data={serviceGraph(clientEnv.NEXT_PUBLIC_SITE_URL, {
          ...service,
          description: service.seoDescription ?? service.summary,
        })}
      />
      <Floor fitScreen>
        <Hero service={service} request={request} />
      </Floor>
      {sections.map((section, index) => (
        <Floor key={index} alt={index % 2 === 0}>
          {section}
        </Floor>
      ))}
      <Closing
        title={service.closingTitle ?? undefined}
        cta={
          service.plans.length > 0
            ? { label: "Solicitar por WhatsApp", href: request }
            : undefined
        }
      />
    </>
  );
}

// The three categories of the home motif (COPY §3), in the same order.
const MOTIF_CATEGORIES = [
  { slug: "presencia-digital", name: "Presencia digital" },
  { slug: "tramites-y-cumplimiento", name: "Trámites y cumplimiento" },
  { slug: "desarrollo-y-datos", name: "Desarrollo y datos" },
] as const;

function Hero({ service, request }: { service: ServicePage; request: string }) {
  const from = lowestPriceCents(service.plans);
  const hasPlans = service.plans.length > 0;
  const active = MOTIF_CATEGORIES.findIndex(
    (category) => category.slug === service.category.slug,
  );
  // Key facts (E6-02): the timeline, how the price works and the hours.
  const facts = [
    service.timeline && { label: "Plazo aproximado", value: service.timeline },
    from !== null
      ? { label: "Precio", value: `Desde ${formatCents(from)}, incluye IVA` }
      : service.priceNote && { label: "Precio", value: service.priceNote },
    { label: "Atención", value: "Todos los días, de 07:00 a 20:00" },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
      <HeroMotif
        categories={[
          MOTIF_CATEGORIES[0].name,
          MOTIF_CATEGORIES[1].name,
          MOTIF_CATEGORIES[2].name,
        ]}
        active={active === -1 ? undefined : active}
        // Only the home hero animates (DESIGN §8). Desktop only, sized by
        // the screen height like the home hero, never distorted.
        still
        className="hidden lg:order-2 lg:block lg:w-[min(100%,calc((100svh-12rem)*0.7961))] lg:justify-self-end"
      />
      <div className="flex flex-col items-start gap-6">
        <nav aria-label="Ruta" className="text-small">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link href="/">Inicio</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/servicios#${service.category.slug}`}>
                {service.category.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page">{service.name}</li>
          </ol>
        </nav>
        <h1>{service.name}</h1>
        {service.summary && <p>{service.summary}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <Button href={request}>
            {hasPlans ? "Solicitar por WhatsApp" : "Escríbenos por WhatsApp"}
          </Button>
          {hasPlans ? (
            <Button href="#planes" variant="secondary">
              Ver planes
            </Button>
          ) : (
            <Button
              href={`/contacto?servicio=${service.slug}#formulario`}
              variant="secondary"
            >
              Cuéntanos tu proyecto
            </Button>
          )}
        </div>
        <dl className="grid w-full gap-4 border-t border-border pt-6 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-1">
              <dt className="text-small">{fact.label}</dt>
              <dd className="font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="flex flex-col gap-10">
      <h2>{title}</h2>
      <ol className="grid gap-10 lg:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step} className="flex flex-col gap-3">
            <span aria-hidden className="text-display leading-none font-bold">
              {index + 1}
            </span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Plans({ service }: { service: ServicePage }) {
  const isSignature = service.slug === "firma-electronica";

  const rows = (holder: ServicePage["plans"][number]["holderType"]) =>
    service.plans
      .filter((plan) => plan.holderType === holder)
      .map((plan): PlanRow => ({
        ...plan,
        detail: plan.detail ?? undefined,
        action: {
          label: "Solicitar",
          href: whatsappUrl(
            isSignature && holder !== "not_applicable"
              ? signaturePlanMessage({
                  holder,
                  validity: plan.name,
                  priceWithoutVat: plan.priceWithoutVat,
                  vatRate: plan.vatRate,
                })
              : serviceMessage(`${service.name} (${plan.name})`),
          ),
        },
      }));

  const table = (holder: ServicePage["plans"][number]["holderType"]) => {
    const note = service.holderNotes[holder];
    return (
      <div className="flex flex-col gap-4">
        {/* Above the cards: on phones it would sit after every plan. */}
        {note && <p>{note}</p>}
        <PlanGrid
          label={HOLDER_LABELS[holder]}
          plans={rows(holder)}
          recommendedLabel="recomendado para facturar"
          vatNote="incluye IVA"
        />
      </div>
    );
  };

  const holders = holderTypes(service.plans);

  return (
    <div id="planes" className="flex scroll-mt-4 flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2>Planes</h2>
        <p>Todos los precios incluyen IVA.</p>
      </div>
      {holders.length > 1 ? (
        <Tabs
          label="Planes"
          tabs={holders.map((holder) => ({
            id: holder,
            label: HOLDER_LABELS[holder],
            content: table(holder),
          }))}
        />
      ) : (
        table(holders[0]!)
      )}
    </div>
  );
}

function Requirements({ service }: { service: ServicePage }) {
  const groups = requirementsByHolder(service.plans);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2>Qué necesitas</h2>
        {service.requirementsIntro && <p>{service.requirementsIntro}</p>}
      </div>
      <div className="grid gap-10 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.holderType} className="flex flex-col gap-4">
            {groups.length > 1 && <h3>{HOLDER_LABELS[group.holderType]}</h3>}
            <ul className="flex list-disc flex-col gap-2 pl-5">
              {group.items.map((item) => (
                <li key={item.text}>{item.text}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Questions({ faqs }: { faqs: ServicePage["faqs"] }) {
  return (
    <div className="flex flex-col gap-8">
      <h2>Preguntas frecuentes</h2>
      <Faq items={faqs} />
    </div>
  );
}

function CrossSell({
  crossSell,
}: {
  crossSell: NonNullable<ServicePage["crossSell"]>;
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="font-medium">También te puede servir.</p>
      <h2>{crossSell.name}</h2>
      <p>{crossSell.text}</p>
      <Button href={`/servicios/${crossSell.slug}`} variant="secondary">
        {crossSell.cta}
      </Button>
    </div>
  );
}

/** Published projects of this service (E6-02), only when there are some. */
function RelatedProjects({
  projects,
}: {
  projects: Awaited<ReturnType<typeof getProjectsForService>>;
}) {
  return (
    <section className="flex flex-col gap-10">
      <h2>Proyectos relacionados</h2>
      <ul className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
      <Button href="/proyectos" variant="secondary" className="self-start">
        Ver todos los proyectos
      </Button>
    </section>
  );
}
