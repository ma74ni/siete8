import { describe, expect, it } from "vitest";

describe("test setup", () => {
  it("resolves the @/ path alias", async () => {
    const mod = await import("@/app/(sitio)/page");
    expect(typeof mod.default).toBe("function");
  });
});
