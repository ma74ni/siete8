import { describe, expect, it } from "vitest";

import {
  generalMessage,
  serviceMessage,
  signaturePlanMessage,
  whatsappUrl,
} from "./whatsapp";

describe("prefilled messages (COPY §2)", () => {
  it("general button", () => {
    expect(generalMessage()).toBe(
      "Hola, vengo del sitio de Siete8. Quiero información sobre:",
    );
  });

  it("service page", () => {
    expect(serviceMessage("Hosting")).toBe(
      "Hola, vengo del sitio de Siete8. Quiero información sobre Hosting.",
    );
  });

  it("signature plan row, with the price including VAT", () => {
    expect(
      signaturePlanMessage({
        holder: "natural",
        validity: "1 año",
        priceWithoutVat: 17.99,
        vatRate: 0.15,
      }),
    ).toBe(
      "Hola, vengo del sitio de Siete8. Quiero una firma electrónica de persona natural con vigencia de 1 año ($20,69 con IVA).",
    );
    expect(
      signaturePlanMessage({
        holder: "legal_entity",
        validity: "2 años",
        priceWithoutVat: 29.99,
        vatRate: 0.15,
      }),
    ).toBe(
      "Hola, vengo del sitio de Siete8. Quiero una firma electrónica de representante legal con vigencia de 2 años ($34,49 con IVA).",
    );
  });
});

describe("whatsappUrl", () => {
  it("links to the commercial number with the encoded message", () => {
    const url = new URL(whatsappUrl(generalMessage()));
    expect(url.origin + url.pathname).toBe("https://wa.me/593961128233");
    expect(url.searchParams.get("text")).toBe(generalMessage());
  });

  it("encodes accents, $ and parentheses", () => {
    const url = whatsappUrl("Firma electrónica ($8,04 con IVA)");
    expect(url).toBe(
      "https://wa.me/593961128233?text=Firma%20electr%C3%B3nica%20(%248%2C04%20con%20IVA)",
    );
  });
});
