import { describe, expect, it } from "vitest";

import { nextTabIndex } from "./tabs-keyboard";

describe("nextTabIndex", () => {
  it("moves right and wraps to the first tab", () => {
    expect(nextTabIndex("ArrowRight", 0, 3)).toBe(1);
    expect(nextTabIndex("ArrowRight", 2, 3)).toBe(0);
  });

  it("moves left and wraps to the last tab", () => {
    expect(nextTabIndex("ArrowLeft", 1, 3)).toBe(0);
    expect(nextTabIndex("ArrowLeft", 0, 3)).toBe(2);
  });

  it("jumps to the first and last tab", () => {
    expect(nextTabIndex("Home", 2, 3)).toBe(0);
    expect(nextTabIndex("End", 0, 3)).toBe(2);
  });

  it("ignores other keys and empty lists", () => {
    expect(nextTabIndex("ArrowDown", 0, 3)).toBeNull();
    expect(nextTabIndex("Enter", 0, 3)).toBeNull();
    expect(nextTabIndex("ArrowRight", 0, 0)).toBeNull();
  });
});
