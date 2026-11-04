import { describe, expect, it } from "vitest";

import { normalizePhone, normalizeTaxId } from "@/lib/client-contact";

describe("normalizeTaxId and normalizePhone", () => {
  it("restores the leading zero that Excel drops", () => {
    expect(normalizeTaxId("912345678")).toBe("0912345678");
    expect(normalizeTaxId("990000000001")).toBe("0990000000001");
    expect(normalizeTaxId("1790000000001")).toBe("1790000000001");
    expect(normalizePhone("991234567")).toBe("0991234567");
    expect(normalizePhone("099-123 4567")).toBe("0991234567");
  });
});
