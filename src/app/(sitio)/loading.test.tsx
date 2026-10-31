import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Loading from "@/app/(sitio)/loading";

describe("the site's loading state", () => {
  it("tells screen readers the page is loading, with no animation", () => {
    const markup = renderToStaticMarkup(<Loading />);
    expect(markup).toContain('role="status"');
    expect(markup).toContain(
      '<span class="sr-only">Cargando la página.</span>',
    );
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toMatch(/animate-|transition/);
  });
});
