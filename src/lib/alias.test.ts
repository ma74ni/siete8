import { describe, expect, it } from "vitest";

describe("test setup", () => {
  it("resolves the @/ path alias", async () => {
    const mod = await import("@/lib/cx");
    expect(typeof mod.cx).toBe("function");
  });
});
