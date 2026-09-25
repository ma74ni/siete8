import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guards the design tokens of globals.css (DESIGN.md §3): WCAG AA contrast of
 * the semantic color pairs in light and dark mode, and no literal colors
 * outside globals.css.
 */

const srcDir = path.resolve(__dirname, "..");
const cssFile = path.join(__dirname, "globals.css");
const css = readFileSync(cssFile, "utf8");

function declarations(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [
      m[1] as string,
      (m[2] as string).trim(),
    ]),
  );
}

function tokens(scheme: "light" | "dark"): Record<string, string> {
  const light = declarations(/:root\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "");
  if (scheme === "light") return light;
  const dark =
    /prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}/.exec(
      css,
    )?.[1];
  return { ...light, ...declarations(dark ?? "") };
}

function resolve(vars: Record<string, string>, name: string): string {
  let value = vars[name];
  for (let i = 0; value && i < 10; i++) {
    const ref = /^var\((--[\w-]+)\)$/.exec(value);
    if (!ref) return value;
    value = vars[ref[1] as string];
  }
  if (!value) throw new Error(`Unknown token ${name}`);
  return value;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum ratio]. 4.5 for text, 3 for focus rings.
const pairs: [string, string, number][] = [
  ["--fg", "--bg", 4.5],
  ["--fg", "--surface", 4.5],
  ["--fg-muted", "--bg", 4.5],
  ["--accent", "--bg", 4.5],
  ["--accent", "--surface", 4.5],
  ["--on-action", "--action", 4.5],
  ["--on-action", "--action-hover", 4.5],
  ["--focus", "--bg", 3],
  ["--focus", "--surface", 3],
];

describe.each(["light", "dark"] as const)("%s mode contrast", (scheme) => {
  const vars = tokens(scheme);

  it.each(pairs)("%s on %s is at least %s:1", (fg, bg, min) => {
    const ratio = contrast(resolve(vars, fg), resolve(vars, bg));
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});

describe("dark mode", () => {
  it("overrides the scheme-dependent tokens", () => {
    const light = tokens("light");
    const dark = tokens("dark");
    for (const name of [
      "--bg",
      "--surface",
      "--fg",
      "--fg-muted",
      "--accent",
    ]) {
      expect(resolve(dark, name)).not.toBe(resolve(light, name));
    }
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    const isSource = /\.(tsx?|css)$/.test(entry.name);
    const isExcluded =
      /\.test\.tsx?$/.test(entry.name) ||
      full === cssFile ||
      entry.name === "database.types.ts";
    return isSource && !isExcluded ? [full] : [];
  });
}

describe("source files", () => {
  const files = sourceFiles(srcDir).map((file) => ({
    name: path.relative(srcDir, file),
    source: readFileSync(file, "utf8"),
  }));

  it("use no literal colors outside globals.css", () => {
    const literal =
      /#[0-9a-f]{3,8}\b(?![\w-])|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/gi;
    const found = files.flatMap(({ name, source }) =>
      [...source.matchAll(literal)].map((m) => `${name}: ${m[0]}`),
    );
    expect(found).toEqual([]);
  });

  it("do not put secondary text on surface (muted on mist is 4.3:1)", () => {
    const classLists = files.flatMap(({ name, source }) =>
      [...source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)].map(
        (m) => ({ name, classes: (m[1] ?? m[2] ?? "").split(/\s+/) }),
      ),
    );
    const offending = classLists
      .filter(
        ({ classes }) =>
          classes.some((c) => /^bg-(surface|mist)$/.test(c)) &&
          classes.some((c) => /^text-(fg-muted|muted)$/.test(c)),
      )
      .map(({ name }) => name);
    expect(offending).toEqual([]);
  });
});
