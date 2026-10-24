import { readdirSync } from "node:fs";
import path from "node:path";

/** The `src/` folder, for tests that read the source code. */
export const srcDir = path.resolve(__dirname, "..");

/**
 * Every source file (.ts, .tsx, .css) under `dir`, without tests, the
 * generated database types and the given absolute paths. For the guard tests
 * of the design system (design tokens, form controls).
 */
export function sourceFiles(dir: string, exclude: string[] = []): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full, exclude);
    const isSource = /\.(tsx?|css)$/.test(entry.name);
    const isExcluded =
      /\.test\.tsx?$/.test(entry.name) ||
      entry.name === "database.types.ts" ||
      exclude.includes(full);
    return isSource && !isExcluded ? [full] : [];
  });
}
