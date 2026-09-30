import { describe, expect, it } from "vitest";

import {
  faqForm,
  holderNoteForm,
  money,
  planForm,
  requirementsForm,
  serviceForm,
} from "@/lib/admin-forms";

const serviceId = "3f2b8a4e-9c1d-4e5f-8a7b-6c5d4e3f2a1b";

describe("money", () => {
  it("accepts a decimal comma or point with up to two decimals", () => {
    expect(money.parse("17,99")).toBe(17.99);
    expect(money.parse(" 20.5 ")).toBe(20.5);
    expect(money.parse("8")).toBe(8);
  });

  it("rejects negative, empty or over-precise prices", () => {
    for (const value of ["-1", "", "1,999", "abc", "1.2.3"]) {
      expect(money.safeParse(value).success).toBe(false);
    }
  });
});

describe("planForm", () => {
  const plan = {
    service_id: serviceId,
    name: " 1 año ",
    holder_type: "natural",
    price_without_vat: "17,99",
    vat_rate: "15",
    sort_order: "3",
  };

  it("parses browser values: checkboxes, VAT percent and order", () => {
    expect(planForm.parse({ ...plan, recommended: "on" })).toEqual({
      service_id: serviceId,
      name: "1 año",
      holder_type: "natural",
      price_without_vat: 17.99,
      vat_rate: 0.15,
      visible: false,
      recommended: true,
      sort_order: 3,
    });
  });

  it("rejects an empty name, an unknown holder type or VAT over 100 %", () => {
    expect(planForm.safeParse({ ...plan, name: "  " }).success).toBe(false);
    expect(planForm.safeParse({ ...plan, holder_type: "x" }).success).toBe(
      false,
    );
    expect(planForm.safeParse({ ...plan, vat_rate: "150" }).success).toBe(
      false,
    );
  });
});

describe("serviceForm", () => {
  it("turns empty texts and no related service into null", () => {
    expect(
      serviceForm.parse({
        id: serviceId,
        visible: "on",
        summary: "  Resumen. ",
        closing_title: "",
        related_service_id: "",
      }),
    ).toMatchObject({
      visible: true,
      summary: "Resumen.",
      closing_title: null,
      related_service_id: null,
      seo_title: null,
    });
  });

  it("enforces the SEO lengths", () => {
    expect(
      serviceForm.safeParse({ id: serviceId, seo_title: "x".repeat(71) })
        .success,
    ).toBe(false);
  });
});

describe("requirementsForm", () => {
  it("keeps one trimmed requirement per line and drops blank lines", () => {
    expect(
      requirementsForm.parse({
        service_id: serviceId,
        holder_type: "legal_entity",
        items: " Cédula vigente. \r\n\n  RUC activo.\n",
      }).items,
    ).toEqual(["Cédula vigente.", "RUC activo."]);
  });

  it("allows at most 20 requirements", () => {
    const items = Array.from({ length: 21 }, (_, i) => `Requisito ${i}`).join(
      "\n",
    );
    expect(
      requirementsForm.safeParse({
        service_id: serviceId,
        holder_type: "natural",
        items,
      }).success,
    ).toBe(false);
  });
});

describe("faqForm and holderNoteForm", () => {
  it("requires a question and an answer", () => {
    expect(
      faqForm.safeParse({
        service_id: serviceId,
        question: "¿Qué?",
        answer: " ",
        sort_order: "1",
      }).success,
    ).toBe(false);
  });

  it("treats an empty note as removing it", () => {
    expect(
      holderNoteForm.parse({
        service_id: serviceId,
        holder_type: "natural",
        body: "  ",
      }).body,
    ).toBeNull();
  });
});
