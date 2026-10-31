import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CheckboxField } from "@/components/form/checkbox-field";

describe("CheckboxField", () => {
  it("labels the checkbox and keeps a 44 px target", () => {
    const markup = renderToStaticMarkup(
      <CheckboxField label="Activado en el sitio" name="enabled" id="activo" />,
    );
    expect(markup).toMatch(/<label for="activo" class="[^"]*\bmin-h-11\b/);
    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain('<input id="activo"');
    expect(markup).toContain('name="enabled"');
    expect(markup).toContain("<span>Activado en el sitio</span>");
    expect(markup).not.toContain("aria-invalid");
    expect(markup).not.toContain("aria-describedby");
  });

  it("accepts a label with a link", () => {
    const markup = renderToStaticMarkup(
      <CheckboxField
        label={
          <>
            Acepto la <a href="/privacidad">política de privacidad</a>.
          </>
        }
        name="consent"
        id="consentimiento"
      />,
    );
    expect(markup).toContain(
      '<span>Acepto la <a href="/privacidad">política de privacidad</a>.</span>',
    );
  });

  it("shows the error outside the label and links it to the checkbox", () => {
    const markup = renderToStaticMarkup(
      <CheckboxField
        label="Acepto"
        name="consent"
        id="consentimiento"
        error="Revisa este campo."
        required
      />,
    );
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="consentimiento-error"');
    expect(markup).toContain('required=""');
    expect(markup).toMatch(
      /<\/label><p id="consentimiento-error"[^>]*>Revisa este campo\.<\/p>/,
    );
  });
});
