import { describe, expect, it } from "vitest";

import { localBusiness, serviceGraph } from "@/lib/structured-data";

const site = "https://siete8.com";

describe("localBusiness", () => {
  it("describes the business with its contact and hours", () => {
    const data = localBusiness(site);
    expect(data["@id"]).toBe("https://siete8.com/#organizacion");
    expect(data.telephone).toBe("+593961128233");
    expect(data.openingHours).toBe("Mo-Su 07:00-20:00");
    expect(data.sameAs).toHaveLength(3);
  });
});

describe("serviceGraph", () => {
  const service = {
    name: "Firma electrónica",
    slug: "firma-electronica",
    description: "Tu firma para facturar.",
    plans: [
      {
        name: "1 año",
        holderType: "natural" as const,
        priceWithoutVat: 17.99,
        vatRate: 0.15,
      },
    ],
    faqs: [{ question: "¿Qué es?", answer: "Una firma." }],
  };

  it("lists each plan as an offer with its price including VAT", () => {
    const [svc] = serviceGraph(site, service)["@graph"];
    expect(svc).toMatchObject({
      "@type": "Service",
      url: "https://siete8.com/servicios/firma-electronica",
      provider: { "@id": "https://siete8.com/#organizacion" },
      offers: [
        {
          name: "Persona natural, 1 año",
          price: "20.69",
          priceCurrency: "USD",
        },
      ],
    });
  });

  it("adds the questions as a FAQ page, and leaves it out without them", () => {
    expect(serviceGraph(site, service)["@graph"][1]).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [
        { name: "¿Qué es?", acceptedAnswer: { text: "Una firma." } },
      ],
    });
    const bare = serviceGraph(site, { ...service, plans: [], faqs: [] });
    expect(bare["@graph"]).toHaveLength(1);
    expect(bare["@graph"][0]).not.toHaveProperty("offers");
  });
});
