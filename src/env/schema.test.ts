import { describe, expect, it } from "vitest";

import { clientSchema, parseEnv, serverSchema } from "./schema";

const client = {
  NEXT_PUBLIC_SITE_URL: "https://siete8.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("parseEnv", () => {
  it("accepts a complete environment", () => {
    const env = parseEnv(clientSchema, client);
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://siete8.com");
  });

  it("fails when a variable is missing and names it", () => {
    expect(() =>
      parseEnv(clientSchema, { ...client, NEXT_PUBLIC_SITE_URL: undefined }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("treats an empty value as missing", () => {
    expect(() =>
      parseEnv(clientSchema, { ...client, NEXT_PUBLIC_SITE_URL: "" }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("fails when a URL is invalid", () => {
    expect(() =>
      parseEnv(clientSchema, { ...client, NEXT_PUBLIC_SITE_URL: "siete8" }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});

describe("Supabase keys", () => {
  it("rejects a secret key in the public variable", () => {
    expect(() =>
      parseEnv(clientSchema, {
        ...client,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("rejects a publishable key as the secret key", () => {
    expect(() =>
      parseEnv(serverSchema, { SUPABASE_SECRET_KEY: "sb_publishable_test" }),
    ).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("accepts a secret key", () => {
    const env = parseEnv(serverSchema, {
      SUPABASE_SECRET_KEY: "sb_secret_test",
    });
    expect(env.SUPABASE_SECRET_KEY).toBe("sb_secret_test");
  });
});
