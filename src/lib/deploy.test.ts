import { describe, expect, it } from "vitest";

import { isProductionDeploy } from "@/lib/deploy";

describe("isProductionDeploy", () => {
  it("is true only for Netlify's production context", () => {
    expect(isProductionDeploy("production")).toBe(true);
    for (const environment of [
      "deploy-preview",
      "branch-deploy",
      "development",
      undefined,
    ]) {
      expect(isProductionDeploy(environment)).toBe(false);
    }
  });
});
