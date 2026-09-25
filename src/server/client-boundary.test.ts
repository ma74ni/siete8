import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Client components must never import server code: the Supabase clients (one
 * of them holds the secret key), server-only variables or the Supabase SDK.
 * `server-only` already breaks the build for modules under `src/server/`; this
 * test also catches direct SDK imports and runs without a build.
 */

const srcDir = path.resolve(__dirname, "..");

const forbidden = [
  (specifier: string) => specifier.startsWith("@supabase/"),
  (specifier: string) =>
    specifier === "@/server" || specifier.startsWith("@/server/"),
  (specifier: string) => specifier === "@/env/server",
];

function isClientModule(source: string): boolean {
  // The directive must be the first statement; comments may precede it.
  const code = source
    .replace(/^\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/g, "")
    .trimStart();
  return /^["']use client["']/.test(code);
}

function importSpecifiers(source: string): string[] {
  const pattern =
    /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s*["']([^"']+)["']/g;
  return [...source.matchAll(pattern)].map(
    (match) => (match[1] ?? match[2] ?? match[3]) as string,
  );
}

/** Rewrites relative specifiers to the `@/` alias so one rule set covers both. */
function toAlias(specifier: string, file: string): string {
  if (!specifier.startsWith(".")) return specifier;
  const absolute = path.resolve(path.dirname(file), specifier);
  const relative = path.relative(srcDir, absolute).split(path.sep).join("/");
  return relative.startsWith("..") ? specifier : `@/${relative}`;
}

function forbiddenImports(source: string, file: string): string[] {
  if (!isClientModule(source)) return [];
  return importSpecifiers(source)
    .map((specifier) => toAlias(specifier, file))
    .filter((specifier) => forbidden.some((rule) => rule(specifier)));
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [full]
      : [];
  });
}

describe("forbiddenImports", () => {
  const file = path.join(srcDir, "components", "sitio", "form.tsx");

  it("flags server imports in client modules", () => {
    const source = [
      '"use client";',
      'import { createAdminClient } from "@/server/supabase/admin";',
      'import { serverEnv } from "../../env/server";',
      'import { createClient } from "@supabase/supabase-js";',
      'const lazy = import("@/server/leads");',
    ].join("\n");
    expect(forbiddenImports(source, file)).toEqual([
      "@/server/supabase/admin",
      "@/env/server",
      "@supabase/supabase-js",
      "@/server/leads",
    ]);
  });

  it("detects the directive after a leading comment", () => {
    const source =
      '// Form state\n"use client";\nimport "@/server/supabase/admin";';
    expect(forbiddenImports(source, file)).toEqual(["@/server/supabase/admin"]);
  });

  it("ignores server modules", () => {
    const source =
      'import { createAdminClient } from "@/server/supabase/admin";';
    expect(forbiddenImports(source, file)).toEqual([]);
  });

  it("allows types and public variables in client modules", () => {
    const source = [
      "'use client'",
      'import type { Database } from "@/lib/database.types";',
      'import { clientEnv } from "@/env/client";',
    ].join("\n");
    expect(forbiddenImports(source, file)).toEqual([]);
  });
});

describe("client components", () => {
  it("do not import server code or the Supabase SDK", () => {
    const violations = sourceFiles(srcDir).flatMap((file) =>
      forbiddenImports(readFileSync(file, "utf8"), file).map(
        (specifier) => `${path.relative(srcDir, file)}: ${specifier}`,
      ),
    );
    expect(violations).toEqual([]);
  });
});
