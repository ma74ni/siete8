import { describe, expect, it } from "vitest";

import {
  clientForm,
  clientServiceForm,
  faqForm,
  holderNoteForm,
  imageFile,
  linkButtonForm,
  money,
  planForm,
  leadAdminForm,
  newLeadForm,
  proformaForm,
  projectForm,
  renewForm,
  requirementsForm,
  serviceForm,
  slugify,
} from "@/lib/admin-forms";

const serviceId = "3f2b8a4e-9c1d-4e5f-8a7b-6c5d4e3f2a1b";

describe("slugify", () => {
  it("removes accents and joins words with hyphens", () => {
    expect(slugify("BI de Seguros y Reportería")).toBe(
      "bi-de-seguros-y-reporteria",
    );
    expect(slugify("  C&G Comercio Exterior! ")).toBe("c-g-comercio-exterior");
  });
});

describe("projectForm", () => {
  const project = {
    title: "Banco de Motos",
    slug: "banco-de-motos",
    status: "replaced",
    client_name: "Banco de Motos",
    show_client_name: "on",
    tech_stack: "Laravel, MySQL, ",
    year: "",
    live_url: "",
    sort_order: "1",
  };

  it("parses the technologies, an empty year and an empty link", () => {
    expect(projectForm.parse(project)).toMatchObject({
      tech_stack: ["Laravel", "MySQL"],
      year: null,
      live_url: null,
      show_client_name: true,
      published: false,
    });
  });

  it("needs the client's name when shown, or the sector otherwise", () => {
    expect(projectForm.safeParse({ ...project, client_name: "" }).success).toBe(
      false,
    );
    expect(
      projectForm.safeParse({ ...project, show_client_name: undefined })
        .success,
    ).toBe(false);
    expect(
      projectForm.safeParse({
        ...project,
        show_client_name: undefined,
        sector: "Banca",
      }).success,
    ).toBe(true);
  });

  it("rejects a bad slug or a link without https", () => {
    expect(
      projectForm.safeParse({ ...project, slug: "Banco Motos" }).success,
    ).toBe(false);
    expect(
      projectForm.safeParse({ ...project, live_url: "http://example.com" })
        .success,
    ).toBe(false);
  });
});

describe("imageFile", () => {
  it("accepts the bucket's types up to 2 MB", () => {
    const ok = new File([new Uint8Array(10)], "a.webp", { type: "image/webp" });
    const svg = new File([new Uint8Array(10)], "a.svg", {
      type: "image/svg+xml",
    });
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "a.png", {
      type: "image/png",
    });
    expect(imageFile.safeParse(ok).success).toBe(true);
    expect(imageFile.safeParse(svg).success).toBe(false);
    expect(imageFile.safeParse(big).success).toBe(false);
  });
});

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
      detail: null,
      holder_type: "natural",
      price_without_vat: 17.99,
      vat_rate: 0.15,
      visible: false,
      recommended: true,
      sort_order: 3,
      cost_without_vat: null,
    });
  });

  it("reads the cost with a decimal comma", () => {
    expect(
      planForm.parse({ ...plan, cost_without_vat: "12,50" }).cost_without_vat,
    ).toBe(12.5);
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

describe("linkButtonForm", () => {
  const base = { label: "Servicios", sort_order: "1", visible: "on" };

  it("keeps the address of a link and drops it for WhatsApp", () => {
    expect(
      linkButtonForm.parse({ ...base, kind: "url", url: " /servicios " }),
    ).toMatchObject({ url: "/servicios", visible: true, highlight: false });
    expect(
      linkButtonForm.parse({ ...base, kind: "whatsapp", url: "/ignorada" }).url,
    ).toBeNull();
  });

  it("needs a site page or an https address for a link", () => {
    expect(
      linkButtonForm.safeParse({ ...base, kind: "url", url: "" }).success,
    ).toBe(false);
    expect(
      linkButtonForm.safeParse({ ...base, kind: "url", url: "http://x.com" })
        .success,
    ).toBe(false);
    expect(
      linkButtonForm.safeParse({ ...base, kind: "url", url: "https://x.com" })
        .success,
    ).toBe(true);
  });
});

describe("clientForm", () => {
  it("normalizes the RUC, the phone and empty fields", () => {
    expect(
      clientForm.parse({
        kind: "company",
        name: " Heladería ",
        tax_id: "990000000001",
        phone: "099 123-4567",
        email: "",
        notes: "",
      }),
    ).toEqual({
      kind: "company",
      name: "Heladería",
      tax_id: "0990000000001",
      phone: "0991234567",
      email: null,
      notes: null,
    });
  });

  it("asks a company for a 13-digit RUC", () => {
    const result = clientForm.safeParse({
      kind: "company",
      name: "Heladería",
      tax_id: "1700000001",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["tax_id"]);
  });
});

describe("clientServiceForm", () => {
  const service = {
    service_id: serviceId,
    sold_on: "2026-10-01",
    starts_on: "2026-10-01",
    price_without_vat: "20",
    vat_rate: "15",
  };

  it("treats a missing unit as a one-off payment and no cost as zero", () => {
    expect(
      clientServiceForm.parse({ ...service, renews_every_value: "3" }),
    ).toMatchObject({
      plan_id: null,
      renews_every_value: null,
      renews_every_unit: null,
      ends_on: null,
      cost_without_vat: 0,
    });
  });

  it("renews every 1 unit when only the unit is chosen", () => {
    expect(
      clientServiceForm.parse({ ...service, renews_every_unit: "month" }),
    ).toMatchObject({ renews_every_value: 1, renews_every_unit: "month" });
  });

  it("rejects a period that ends before it starts", () => {
    const result = clientServiceForm.safeParse({
      ...service,
      ends_on: "2026-09-01",
    });
    expect(result.error?.issues[0]?.path).toEqual(["ends_on"]);
  });
});

describe("leadAdminForm", () => {
  const lead = { id: serviceId, notes: "" };

  it("needs a reason when the lead is lost", () => {
    const result = leadAdminForm.safeParse({ ...lead, status: "lost" });
    expect(result.error?.issues[0]?.path).toEqual(["lost_reason"]);
    expect(
      leadAdminForm.parse({
        ...lead,
        status: "lost",
        lost_reason: " Eligió otro proveedor. ",
      }).lost_reason,
    ).toBe("Eligió otro proveedor.");
  });

  it("drops the reason for any other status", () => {
    expect(
      leadAdminForm.parse({ ...lead, status: "won", lost_reason: "Precio." }),
    ).toMatchObject({ status: "won", lost_reason: null });
  });

  it("accepts the new statuses and rejects the old 'closed'", () => {
    expect(
      leadAdminForm.parse({ ...lead, status: "proposal_sent" }).status,
    ).toBe("proposal_sent");
    expect(leadAdminForm.safeParse({ ...lead, status: "closed" }).success).toBe(
      false,
    );
  });
});

describe("newLeadForm", () => {
  const lead = {
    name: " Ana Prueba ",
    phone: "099 123-4567",
    email: "",
    consent: "on",
  };

  it("normalizes the phone and leaves the optional fields empty", () => {
    expect(newLeadForm.parse(lead)).toEqual({
      name: "Ana Prueba",
      phone: "0991234567",
      email: null,
      service_id: null,
      plan_id: null,
      message: null,
      notes: null,
      consent: "on",
    });
  });

  it("needs the phone or the email", () => {
    const result = newLeadForm.safeParse({ ...lead, phone: "" });
    expect(result.error?.issues[0]?.path).toEqual(["contact"]);
    expect(
      newLeadForm.safeParse({ ...lead, phone: "", email: "ana@prueba.test" })
        .success,
    ).toBe(true);
  });

  it("needs the consent confirmed", () => {
    const result = newLeadForm.safeParse({ ...lead, consent: undefined });
    expect(result.error?.issues[0]?.path).toEqual(["consent"]);
  });

  it("reports a badly written phone as the phone, not as missing", () => {
    const result = newLeadForm.safeParse({ ...lead, phone: "12345" });
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([
      ["phone"],
    ]);
  });

  it("accepts a plan together with its service", () => {
    expect(
      newLeadForm.parse({ ...lead, service_id: serviceId, plan_id: serviceId }),
    ).toMatchObject({ service_id: serviceId, plan_id: serviceId });
  });

  it("rejects a plan without a service and an invalid email", () => {
    expect(
      newLeadForm.safeParse({ ...lead, plan_id: serviceId }).error?.issues[0]
        ?.path,
    ).toEqual(["plan_id"]);
    expect(newLeadForm.safeParse({ ...lead, email: "ana@" }).success).toBe(
      false,
    );
  });
});

describe("proformaForm", () => {
  const proforma = {
    lead_id: serviceId,
    service_id: serviceId,
    price_without_vat: "45,50",
    vat_rate: "15",
    sent_on: "2026-10-24",
  };

  it("parses the offered price without VAT and an optional plan", () => {
    expect(proformaForm.parse(proforma)).toEqual({
      ...proforma,
      plan_id: null,
      price_without_vat: 45.5,
      vat_rate: 0.15,
    });
  });

  it("rejects a price of zero: a forgotten price", () => {
    const result = proformaForm.safeParse({
      ...proforma,
      price_without_vat: "0",
    });
    expect(result.error?.issues[0]?.path).toEqual(["price_without_vat"]);
  });

  it("needs a send date and a valid price", () => {
    expect(proformaForm.safeParse({ ...proforma, sent_on: "" }).success).toBe(
      false,
    );
    expect(
      proformaForm.safeParse({ ...proforma, price_without_vat: "abc" }).success,
    ).toBe(false);
  });
});

describe("renewForm", () => {
  const renewal = {
    client_service_id: serviceId,
    sold_on: "2026-10-23",
    starts_on: "2026-11-05",
    ends_on: "2027-11-05",
    price_without_vat: "17,99",
    vat_rate: "15",
    cost_without_vat: "8",
  };

  it("parses the prefilled next period", () => {
    expect(renewForm.parse(renewal)).toEqual({
      client_service_id: serviceId,
      sold_on: "2026-10-23",
      starts_on: "2026-11-05",
      ends_on: "2027-11-05",
      price_without_vat: 17.99,
      vat_rate: 0.15,
      cost_without_vat: 8,
    });
  });

  it("needs an end date: a renewal always expires", () => {
    const result = renewForm.safeParse({ ...renewal, ends_on: "" });
    expect(result.error?.issues[0]?.path).toEqual(["ends_on"]);
  });

  it("rejects an end before the start", () => {
    const result = renewForm.safeParse({ ...renewal, ends_on: "2026-11-01" });
    expect(result.error?.issues[0]?.path).toEqual(["ends_on"]);
  });
});
