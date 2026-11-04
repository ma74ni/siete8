import { describe, expect, it } from "vitest";

import { addPeriod, parseDay, todayInQuito } from "@/lib/days";

describe("addPeriod", () => {
  it("adds days, months and years", () => {
    expect(addPeriod("2026-10-12", 30, "day")).toBe("2026-11-11");
    expect(addPeriod("2026-10-12", 1, "month")).toBe("2026-11-12");
    expect(addPeriod("2026-10-12", 2, "year")).toBe("2028-10-12");
  });

  it("stays on the last day of a shorter month", () => {
    expect(addPeriod("2026-01-31", 1, "month")).toBe("2026-02-28");
    expect(addPeriod("2028-02-29", 1, "year")).toBe("2029-02-28");
  });
});

describe("todayInQuito", () => {
  it("is still yesterday in Quito before 05:00 UTC", () => {
    expect(todayInQuito(new Date("2026-10-13T03:00:00Z"))).toBe("2026-10-12");
    expect(todayInQuito(new Date("2026-10-13T06:00:00Z"))).toBe("2026-10-13");
  });
});

describe("parseDay", () => {
  it("reads dates as Excel writes them in Ecuador", () => {
    expect(parseDay("1/10/2026")).toBe("2026-10-01");
    expect(parseDay("2026-10-01")).toBe("2026-10-01");
    expect(parseDay("31/02/2026")).toBeNull();
    expect(parseDay("10/2026")).toBeNull();
  });
});
