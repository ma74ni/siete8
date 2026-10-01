import { describe, expect, it } from "vitest";

import {
  formatPostDate,
  fromQuitoInput,
  pageCount,
  readingMinutes,
  toQuitoInput,
} from "@/lib/blog";

describe("dates in Quito time", () => {
  it("formats the date as in Quito, even late at night in UTC", () => {
    // 02:00 UTC on Oct 1 is still Sep 30 in Quito.
    expect(formatPostDate("2026-10-01T02:00:00Z")).toBe(
      "30 de septiembre de 2026",
    );
  });

  it("round-trips a datetime-local value typed in Quito", () => {
    const iso = fromQuitoInput("2026-10-05T08:30");
    expect(iso).toBe("2026-10-05T13:30:00.000Z");
    expect(toQuitoInput(iso)).toBe("2026-10-05T08:30");
  });
});

describe("readingMinutes", () => {
  it("counts about 200 words a minute, at least one", () => {
    expect(readingMinutes("Hola")).toBe(1);
    expect(readingMinutes(Array(1000).fill("palabra").join(" "))).toBe(5);
    expect(readingMinutes("## Título\n\n- **uno** [dos](/tres)")).toBe(1);
  });
});

describe("pageCount", () => {
  it("has at least one page and rounds up", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(9)).toBe(1);
    expect(pageCount(10)).toBe(2);
  });
});
