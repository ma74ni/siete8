import { describe, expect, it } from "vitest";

import { campaignFromSearch, whatsappClickParams } from "@/lib/analytics";
import { signaturePlanMessage, whatsappUrl } from "@/lib/whatsapp";

describe("campaignFromSearch", () => {
  it("maps UTM parameters to GA campaign fields", () => {
    expect(
      campaignFromSearch(
        "?utm_source=facebook&utm_medium=social&utm_campaign=lanzamiento&x=1",
      ),
    ).toEqual({
      campaign_source: "facebook",
      campaign_medium: "social",
      campaign_name: "lanzamiento",
    });
  });

  it("returns null without UTM parameters or with empty ones", () => {
    expect(campaignFromSearch("")).toBeNull();
    expect(campaignFromSearch("?utm_source=%20&q=firma")).toBeNull();
  });
});

describe("whatsappClickParams", () => {
  it("sends the page, the button and the prefilled message", () => {
    const href = whatsappUrl(
      signaturePlanMessage({
        holder: "natural",
        validity: "1 año",
        priceWithoutVat: 17.99,
        vatRate: 0.15,
      }),
    );
    const params = whatsappClickParams(
      href,
      "/servicios/firma-electronica",
      " Solicitar ",
    );
    expect(params).toMatchObject({
      page_path: "/servicios/firma-electronica",
      link_label: "Solicitar",
    });
    expect(params?.message).toMatch(
      /^Hola, vengo del sitio de Siete8\. Quiero una firma/,
    );
    expect(params?.message.length).toBeLessThanOrEqual(100);
  });

  it("ignores links that do not open WhatsApp", () => {
    expect(
      whatsappClickParams("https://siete8.com/servicios", "/", "x"),
    ).toBeNull();
    expect(whatsappClickParams("/contacto", "/", "x")).toBeNull();
  });
});
