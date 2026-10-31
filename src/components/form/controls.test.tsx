import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import {
  controlClass,
  describedBy,
  Textarea,
} from "@/components/form/controls";
import { sourceFiles, srcDir } from "@/test-utils/source-files";

const controlsFile = path.join(__dirname, "controls.tsx");

describe("controlClass", () => {
  it("is 48 px tall, or 128 px for a textarea, with tabular figures on request", () => {
    expect(controlClass()).toContain("min-h-12");
    expect(controlClass({ multiline: true })).toContain("min-h-32");
    expect(controlClass({ numeric: true })).toContain("tabular-nums");
    expect(controlClass({ className: "w-24" })).toContain("w-24");
  });

  it("marks invalid fields with the accent border", () => {
    expect(controlClass()).toContain("aria-[invalid=true]:border-accent");
  });
});

describe("Textarea", () => {
  it("is 128 px tall, or as tall as a text box when compact", () => {
    expect(renderToStaticMarkup(<Textarea />)).toContain("min-h-32");
    const compact = renderToStaticMarkup(<Textarea compact rows={2} />);
    expect(compact).toContain("min-h-12");
    expect(compact).not.toContain("min-h-32");
    expect(compact).not.toContain("compact");
  });
});

describe("describedBy", () => {
  it("links the hint and the error, or nothing", () => {
    expect(describedBy("field-email", "Ayuda", "Error")).toBe(
      "field-email-hint field-email-error",
    );
    expect(describedBy("field-email", undefined, "Error")).toBe(
      "field-email-error",
    );
    expect(describedBy("field-email", undefined, undefined)).toBeUndefined();
  });
});

// E13-01: the control's look lives in one file (DESIGN §7.1).
describe("form controls in the source", () => {
  it("no file other than controls.tsx styles a control with the field border", () => {
    const offenders = sourceFiles(srcDir, [controlsFile])
      .filter((file) =>
        readFileSync(file, "utf8").includes("border-field-border"),
      )
      .map((file) => path.relative(srcDir, file));
    expect(offenders).toEqual([]);
  });
});
