import { describe, expect, it } from "vitest";

import { clientSchema, parseEnv } from "./schema";

describe("parseEnv", () => {
  it("accepts a complete environment", () => {
    const env = parseEnv(clientSchema, {
      NEXT_PUBLIC_SITE_URL: "https://siete8.com",
    });
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://siete8.com");
  });

  it("fails when a variable is missing and names it", () => {
    expect(() => parseEnv(clientSchema, {})).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("treats an empty value as missing", () => {
    expect(() => parseEnv(clientSchema, { NEXT_PUBLIC_SITE_URL: "" })).toThrow(
      /NEXT_PUBLIC_SITE_URL/,
    );
  });

  it("fails when a URL is invalid", () => {
    expect(() =>
      parseEnv(clientSchema, { NEXT_PUBLIC_SITE_URL: "siete8" }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
