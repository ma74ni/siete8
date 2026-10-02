import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  hoursText,
  parseSettings,
  settingsForm,
  toTel,
  toWaMe,
} from "@/lib/site-settings";

describe("toWaMe and toTel", () => {
  it("adds Ecuador's code to local numbers", () => {
    expect(toWaMe("0967155626")).toBe("593967155626");
    expect(toWaMe("+593 96 715 5626")).toBe("593967155626");
    expect(toTel("0999843108")).toBe("+593999843108");
  });
});

describe("parseSettings", () => {
  it("reads the rows of site_settings", () => {
    const settings = parseSettings([
      {
        key: "whatsapp",
        value: {
          number: "0991112222",
          wa_me: "593991112222",
          hours: { from: "08:00", to: "18:00" },
        },
      },
      { key: "contact", value: { phone: "022345678", email: "a@siete8.com" } },
      {
        key: "social",
        value: [{ label: "TikTok", url: "https://tiktok.com/@siete8" }],
      },
    ]);
    expect(settings.whatsapp).toEqual({
      number: "0991112222",
      waMe: "593991112222",
      from: "08:00",
      to: "18:00",
    });
    expect(settings.email).toBe("a@siete8.com");
    expect(settings.social).toEqual([
      { label: "TikTok", url: "https://tiktok.com/@siete8" },
    ]);
    expect(hoursText(settings)).toBe("Todos los días, de 08:00 a 18:00");
  });

  it("falls back to the defaults for missing or broken rows", () => {
    expect(
      parseSettings([{ key: "whatsapp", value: { number: "abc" } }]),
    ).toEqual(DEFAULT_SETTINGS);
  });
});

describe("settingsForm", () => {
  const form = {
    whatsapp: "096 715-5626",
    from: "07:00",
    to: "20:00",
    phone: "099 984 3108",
    email: "hola@siete8.com",
    social: [
      { label: "Facebook", url: "https://www.facebook.com/siete8.ec" },
      { label: "", url: "" },
    ],
  };

  it("cleans the numbers and drops empty social rows", () => {
    expect(settingsForm.parse(form)).toEqual({
      ...form,
      whatsapp: "0967155626",
      phone: "0999843108",
      social: [
        { label: "Facebook", url: "https://www.facebook.com/siete8.ec" },
      ],
    });
  });

  it("rejects a bad number, closing before opening, or a link without https", () => {
    expect(settingsForm.safeParse({ ...form, whatsapp: "12345" }).success).toBe(
      false,
    );
    expect(
      settingsForm.safeParse({ ...form, from: "20:00", to: "07:00" }).success,
    ).toBe(false);
    expect(
      settingsForm.safeParse({
        ...form,
        social: [{ label: "Facebook", url: "http://facebook.com" }],
      }).success,
    ).toBe(false);
  });
});
