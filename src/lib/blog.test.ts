import { describe, expect, it } from "vitest";

import {
  formatPostDate,
  fromQuitoInput,
  pageCount,
  postState,
  postStateLabel,
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

describe("postState and postStateLabel", () => {
  const now = new Date("2026-10-28T15:00:00Z");
  const at = (published_at: string | null) => ({
    status: "published" as const,
    published_at,
  });

  it("keeps a draft as a draft, even with a date", () => {
    for (const published_at of [null, "2026-10-01T15:00:00Z"]) {
      const post = { status: "draft" as const, published_at };
      expect(postState(post, now)).toBe("draft");
      expect(postStateLabel(post, now)).toBe("Borrador");
    }
  });

  it("schedules a post with a later date", () => {
    const post = at("2026-11-02T15:00:00Z");
    expect(postState(post, now)).toBe("scheduled");
    expect(postStateLabel(post, now)).toBe(
      "Programado para el 2 de noviembre de 2026",
    );
  });

  it("publishes a post from its date on, inclusive, as the database does", () => {
    expect(postState(at("2026-10-01T15:00:00Z"), now)).toBe("published");
    expect(postState(at(now.toISOString()), now)).toBe("published");
    expect(postState(at("2026-10-28T15:00:01Z"), now)).toBe("scheduled");
    expect(postStateLabel(at("2026-10-01T15:00:00Z"), now)).toBe(
      "Publicado el 1 de octubre de 2026",
    );
  });

  it("treats a published post without a date as published", () => {
    expect(postState(at(null), now)).toBe("published");
    expect(postStateLabel(at(null), now)).toBe("Publicado");
  });
});
