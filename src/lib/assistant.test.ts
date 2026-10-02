import { describe, expect, it } from "vitest";

import {
  assistantForm,
  chatRequest,
  contactInput,
  costUsd,
  DEFAULT_ASSISTANT,
  handoffMessage,
  LIMITS,
  monthStart,
  parseAssistant,
  startRequest,
} from "@/lib/assistant";
import { serviceContext, systemPrompt } from "@/lib/assistant-prompt";
import type { ServicePage } from "@/server/catalog";

describe("costUsd (RNF-28)", () => {
  it("prices input, output and cache tokens", () => {
    expect(
      costUsd({
        input_tokens: 1_000_000,
        output_tokens: 100_000,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 1_000_000,
      }),
    ).toBeCloseTo(2 + 1 + 0.2);
    expect(costUsd({ input_tokens: 0, output_tokens: 0 })).toBe(0);
  });
});

describe("monthStart", () => {
  it("starts the month at midnight in Quito", () => {
    expect(monthStart(new Date("2026-10-15T12:00:00Z")).toISOString()).toBe(
      "2026-10-01T05:00:00.000Z",
    );
    // 23:30 of September 30 in Quito is still September.
    expect(monthStart(new Date("2026-10-01T04:30:00Z")).toISOString()).toBe(
      "2026-09-01T05:00:00.000Z",
    );
  });
});

describe("parseAssistant", () => {
  it("reads the private row and falls back to the defaults", () => {
    expect(
      parseAssistant({ prompt: "Sé breve.", monthly_budget_usd: 15 }),
    ).toEqual({ prompt: "Sé breve.", monthlyBudgetUsd: 15 });
    expect(parseAssistant(null)).toEqual(DEFAULT_ASSISTANT);
    expect(parseAssistant({ prompt: 1 })).toEqual(DEFAULT_ASSISTANT);
  });
});

describe("assistantForm", () => {
  it("reads the checkbox and the cap", () => {
    expect(
      assistantForm.parse({ enabled: "on", prompt: " Hola ", budget: "10" }),
    ).toEqual({ enabled: true, prompt: "Hola", budget: 10 });
    expect(assistantForm.parse({ prompt: "", budget: "0" }).enabled).toBe(
      false,
    );
    expect(assistantForm.safeParse({ prompt: "", budget: "-1" }).success).toBe(
      false,
    );
  });
});

describe("contactInput (RF-AST-04)", () => {
  it("normalizes an Ecuadorian cell phone", () => {
    const contact = contactInput.parse({
      name: "Ana",
      phone: "099 123-4567",
      summary: "Quiero una firma de un año.",
    });
    expect(contact.phone).toBe("0991234567");
  });

  it("rejects missing or invalid data", () => {
    expect(
      contactInput.safeParse({ name: "Ana", phone: "123", summary: "Firma" })
        .success,
    ).toBe(false);
    expect(
      contactInput.safeParse({ name: "Ana", phone: "0991234567" }).success,
    ).toBe(false);
  });

  it("builds the WhatsApp message with the summary (RF-AST-05)", () => {
    expect(handoffMessage({ name: "Ana", summary: "Quiero una firma." })).toBe(
      "Hola, vengo del asistente del sitio de Siete8. Soy Ana. Quiero una firma.",
    );
  });
});

describe("requests", () => {
  it("needs consent to start (RNF-19)", () => {
    expect(
      startRequest.safeParse({ turnstileToken: "t", consent: false }).success,
    ).toBe(false);
    expect(
      startRequest.safeParse({ turnstileToken: "t", consent: true }).success,
    ).toBe(true);
  });

  it("limits the length of a message", () => {
    const sessionId = "00000000-0000-4000-8000-000000000001";
    expect(chatRequest.safeParse({ sessionId, message: "Hola" }).success).toBe(
      true,
    );
    expect(
      chatRequest.safeParse({
        sessionId,
        message: "x".repeat(LIMITS.messageChars + 1),
      }).success,
    ).toBe(false);
    expect(
      chatRequest.safeParse({ sessionId: "x", message: "Hola" }).success,
    ).toBe(false);
  });
});

const signature: ServicePage = {
  name: "Firma electrónica",
  slug: "firma-electronica",
  summary: "Tu firma para facturar en el SRI.",
  body: null,
  timeline: "En minutos",
  priceNote: null,
  requirementsIntro: null,
  closingTitle: null,
  seoTitle: null,
  seoDescription: null,
  category: { name: "Firma electrónica", slug: "firma" },
  plans: [
    {
      id: "1",
      name: "1 año",
      holderType: "natural",
      priceWithoutVat: 17.99,
      vatRate: 0.15,
      recommended: true,
      sortOrder: 1,
      detail: null,
      requirements: [
        { text: "RUC", required: false, sortOrder: 2 },
        { text: "Cédula", required: true, sortOrder: 1 },
      ],
    },
    {
      id: "2",
      name: "1 año",
      holderType: "legal_entity",
      priceWithoutVat: 25,
      vatRate: 0.15,
      recommended: false,
      sortOrder: 2,
      detail: null,
      requirements: [],
    },
  ],
  steps: ["Escríbenos", "Envía los requisitos"],
  holderNotes: { legal_entity: "La firma es para el representante." },
  faqs: [{ question: "¿Sirve para el SRI?", answer: "Sí." }],
  crossSell: null,
};

describe("serviceContext (RF-AST-02)", () => {
  const text = serviceContext(signature);

  it("shows prices with VAT from the shared function", () => {
    expect(text).toContain("- Persona natural, 1 año: $20,69 (el más elegido)");
    expect(text).toContain("- Representante legal, 1 año: $28,75");
  });

  it("lists requirements in order and marks the optional ones", () => {
    expect(text).toContain("Requisitos: Cédula; RUC (opcional)");
  });

  it("includes steps, notes and questions", () => {
    expect(text).toContain("1. Escríbenos");
    expect(text).toContain(
      "Nota para representante legal: La firma es para el representante.",
    );
    expect(text).toContain("- ¿Sirve para el SRI?\n  Sí.");
  });
});

describe("systemPrompt", () => {
  it("puts the rules, hours, instructions and catalog together", () => {
    const prompt = systemPrompt({
      services: [signature],
      hours: "Todos los días, de 07:00 a 20:00",
      instructions: "Destaca la firma.",
    });
    expect(prompt).toContain("Nunca inventes precios");
    expect(prompt).toContain("de 07:00 a 20:00");
    expect(prompt).toContain("Destaca la firma.");
    expect(prompt).toContain("## Firma electrónica");
  });
});
