import { describe, expect, it } from "vitest";

import {
  invalidFields,
  leadEmail,
  leadForm,
  normalizePhone,
  parseUtm,
} from "@/lib/contact-form";

const valid = {
  name: " Ana Pérez ",
  phone: "099 123-4567",
  email: "",
  service: "firma-electronica",
  message: "Quiero una firma de 1 año.",
  consent: "on",
  website: "",
  utm: JSON.stringify({ campaign_source: "facebook", campaign_name: "blog" }),
};

describe("leadForm", () => {
  it("cleans the fields and keeps the campaign", () => {
    expect(leadForm.parse(valid)).toEqual({
      name: "Ana Pérez",
      phone: "0991234567",
      email: null,
      service: "firma-electronica",
      message: "Quiero una firma de 1 año.",
      consent: "on",
      website: "",
      utm: { source: "facebook", campaign: "blog" },
    });
  });

  it("needs consent, a name and a valid phone", () => {
    const result = leadForm.safeParse({
      ...valid,
      consent: undefined,
      name: "",
      phone: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(invalidFields(result.error).sort()).toEqual([
        "consent",
        "name",
        "phone",
      ]);
    }
  });

  it("rejects a filled honeypot and a bad email", () => {
    expect(leadForm.safeParse({ ...valid, website: "spam.com" }).success).toBe(
      false,
    );
    expect(leadForm.safeParse({ ...valid, email: "ana@" }).success).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("keeps only digits and a leading plus", () => {
    expect(normalizePhone("+593 (99) 123-4567")).toBe("+593991234567");
  });
});

describe("parseUtm", () => {
  it("ignores broken or unexpected values", () => {
    expect(parseUtm("no es json")).toEqual({});
    expect(parseUtm("[1]")).toEqual({});
    expect(parseUtm(JSON.stringify({ campaign_source: 3, x: "y" }))).toEqual(
      {},
    );
    expect(parseUtm(undefined)).toEqual({});
  });
});

describe("leadEmail", () => {
  it("lists the contact, the service, the origin and the panel link", () => {
    const email = leadEmail(
      {
        name: "Ana",
        phone: "0991234567",
        email: null,
        message: null,
        utm: { source: "facebook" },
        serviceName: "Firma electrónica",
      },
      "https://siete8.com/admin/leads/1",
    );
    expect(email.subject).toBe(
      "Nuevo contacto desde el sitio: Ana (Firma electrónica)",
    );
    expect(email.text).toBe(
      [
        "Nombre: Ana",
        "Celular: 0991234567",
        "Servicio: Firma electrónica",
        "Origen: source=facebook",
        "",
        "(Sin mensaje)",
        "",
        "Ver en el panel: https://siete8.com/admin/leads/1",
      ].join("\n"),
    );
  });
});
