import { priceWithVatCents } from "@/lib/price";
import { HOLDER_LABELS, type HolderType } from "@/lib/service-page";
import { SOCIAL_LINKS } from "@/lib/social";

/**
 * JSON-LD for search engines (RNF-05): the business, each service with its
 * plans as offers, and its questions. Prices go with VAT, like on the site.
 */

const ORG_ID = "#organizacion";

export function localBusiness(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": new URL(ORG_ID, siteUrl).toString(),
    name: "Siete8",
    url: new URL("/", siteUrl).toString(),
    image: new URL("/og.png", siteUrl).toString(),
    telephone: "+593961128233",
    email: "hola@siete8.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Quito",
      addressCountry: "EC",
    },
    openingHours: "Mo-Su 07:00-20:00",
    sameAs: SOCIAL_LINKS.map((link) => link.href),
  };
}

type ServiceInput = {
  name: string;
  slug: string;
  description: string | null;
  plans: {
    name: string;
    holderType: HolderType;
    priceWithoutVat: number;
    vatRate: number;
  }[];
  faqs: { question: string; answer: string }[];
};

export function serviceGraph(siteUrl: string, service: ServiceInput) {
  const url = new URL(`/servicios/${service.slug}`, siteUrl).toString();
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Service",
      name: service.name,
      url,
      ...(service.description && { description: service.description }),
      provider: { "@id": new URL(ORG_ID, siteUrl).toString() },
      areaServed: { "@type": "Country", name: "Ecuador" },
      ...(service.plans.length > 0 && {
        offers: service.plans.map((plan) => ({
          "@type": "Offer",
          name:
            plan.holderType === "not_applicable"
              ? plan.name
              : `${HOLDER_LABELS[plan.holderType]}, ${plan.name}`,
          price: (
            priceWithVatCents(plan.priceWithoutVat, plan.vatRate) / 100
          ).toFixed(2),
          priceCurrency: "USD",
          url,
        })),
      }),
    },
  ];
  if (service.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: service.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

/** An article (RNF-05): headline, dates, author and the publisher. */
export function articleData(
  siteUrl: string,
  post: {
    slug: string;
    title: string;
    excerpt: string | null;
    author: string;
    publishedAt: string;
    updatedAt: string;
    coverUrl: string | null;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.excerpt && { description: post.excerpt }),
    url: new URL(`/blog/${post.slug}`, siteUrl).toString(),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: post.coverUrl ?? new URL("/og.png", siteUrl).toString(),
    author: {
      "@type": post.author === "Siete8" ? "Organization" : "Person",
      name: post.author,
    },
    publisher: { "@id": new URL(ORG_ID, siteUrl).toString() },
    inLanguage: "es-EC",
  };
}
