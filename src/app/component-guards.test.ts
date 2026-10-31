import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { sourceFiles, srcDir } from "@/test-utils/source-files";

/**
 * E13-05 (DESIGN §7.1 and §12.1): tables, disclosures and form controls are
 * written only inside the components that own them. Pages and other
 * components use those components. The look of the field border has its own
 * guard in `components/form/controls.test.tsx`.
 */

type Guard = {
  what: string;
  find: (code: string) => boolean;
  /** Files under `src/` allowed to write it. */
  owners: string[];
  use: string;
};

/**
 * `<input>` elements other than hidden ones, which carry form data. Each one
 * ends at its first `>` that is not part of an arrow (`=>`).
 */
function visibleInput(code: string): boolean {
  return [...code.matchAll(/<input\b(?:=>|[^>])*?\/?>/g)].some(
    ([element]) => !/type="hidden"/.test(element),
  );
}

const GUARDS: Guard[] = [
  {
    what: "<select>",
    find: (code) => /<select\b/.test(code),
    owners: ["components/form/controls.tsx"],
    use: "SelectField (o Select)",
  },
  {
    what: "<textarea>",
    find: (code) => /<textarea\b/.test(code),
    owners: ["components/form/controls.tsx"],
    use: "FormField con multiline (o Textarea)",
  },
  {
    what: "<input> visible",
    find: visibleInput,
    owners: [
      "components/form/controls.tsx",
      // File pickers and the honeypot have no styled box.
      "components/admin/image-field.tsx",
      "components/admin/client-import-form.tsx",
      "components/sitio/honeypot-field.tsx",
    ],
    use: "FormField, CheckboxField (o Input, Checkbox, Radio)",
  },
  {
    what: "<table>",
    find: (code) => /<table\b/.test(code),
    owners: [
      "components/admin/data-table.tsx",
      "components/sitio/plan-table.tsx",
    ],
    use: "DataTable en el panel (PlanTable para los planes del sitio)",
  },
  {
    what: "<details> o <summary>",
    find: (code) => /<(details|summary)\b/.test(code),
    owners: ["components/admin/disclosure.tsx", "components/sitio/faq.tsx"],
    use: "Disclosure en el panel (Faq para las preguntas del sitio)",
  },
  {
    what: "controlClass()",
    find: (code) => /\bcontrolClass\(/.test(code),
    owners: ["components/form/controls.tsx"],
    use: "los controles de components/form/controls.tsx",
  },
];

/**
 * Comments may name an element (`<input type="date">`) without writing one.
 * Only JSX comments and comments that start a line are removed, so a `/*`
 * inside a string (`accept="image/*"`) never swallows code. A comment at the
 * end of a line of code, or a dynamic `type={…}`, still counts: the guard
 * errs on the side of flagging.
 */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/^\s*\/\*[\s\S]*?\*\//gm, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/** What `file` (relative to `src/`, with "/") writes outside its owners. */
function violations(file: string, source: string): string[] {
  const code = withoutComments(source);
  return GUARDS.filter(
    (guard) => !guard.owners.includes(file) && guard.find(code),
  ).map((guard) => `${file}: ${guard.what}; usa ${guard.use}`);
}

describe("violations", () => {
  const page = "app/admin/(panel)/ejemplo/page.tsx";

  it("flags a <select> added to a page and passes without it", () => {
    const withSelect = `export default function Page() {
  return <select name="estado"><option>Todos</option></select>;
}`;
    expect(violations(page, withSelect)).toEqual([
      `${page}: <select>; usa SelectField (o Select)`,
    ]);
    expect(
      violations(page, withSelect.replace(/<select[\s\S]*<\/select>/, "null")),
    ).toEqual([]);
  });

  it("flags tables, disclosures, text areas and the control class", () => {
    const code = `<table /><details><summary>Ver</summary></details>
<textarea /><div className={controlClass()} />`;
    expect(violations(page, code)).toHaveLength(4);
  });

  it("allows hidden inputs but not visible ones", () => {
    expect(
      violations(page, `<input type="hidden" name="id" value={id} />`),
    ).toEqual([]);
    expect(
      violations(page, `<input\n  name="q"\n  onChange={(e) => go(e)}\n/>`),
    ).toEqual([
      `${page}: <input> visible; usa FormField, CheckboxField (o Input, Checkbox, Radio)`,
    ]);
  });

  it("does not lose code after a /* inside a string", () => {
    const code = `<input type="file" accept="image/*" />
<select name="x" />
/** Doc. */`;
    expect(violations(page, code)).toEqual([
      `${page}: <select>; usa SelectField (o Select)`,
      `${page}: <input> visible; usa FormField, CheckboxField (o Input, Checkbox, Radio)`,
    ]);
  });

  it("checks an open and closed <input> on its own", () => {
    expect(
      violations(
        page,
        `<input name="q"></input>\n<input type="hidden" name="id" />`,
      ),
    ).toHaveLength(1);
  });

  it("ignores elements named in comments", () => {
    expect(
      violations(
        page,
        `/** Value of an \`<input type="date">\`. */\n// <table>\n{/* <details> */}`,
      ),
    ).toEqual([]);
  });

  it("lets each owner write its own element", () => {
    expect(violations("components/admin/data-table.tsx", "<table />")).toEqual(
      [],
    );
    expect(violations("components/sitio/faq.tsx", "<table />")).toHaveLength(1);
  });
});

describe("the source code", () => {
  it("writes tables, disclosures and controls only in their components", () => {
    const found = sourceFiles(srcDir)
      .filter((file) => /\.tsx?$/.test(file))
      .flatMap((file) =>
        violations(
          path.relative(srcDir, file).split(path.sep).join("/"),
          readFileSync(file, "utf8"),
        ),
      );
    expect(found).toEqual([]);
  });
});
