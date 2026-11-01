import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PendingLabel } from "@/components/sitio/layout/pending-label";

const status = vi.hoisted(() => ({ pending: false }));
vi.mock("next/link", () => ({ useLinkStatus: () => status }));

describe("PendingLabel", () => {
  it("is plain text while nothing is loading", () => {
    status.pending = false;
    expect(renderToStaticMarkup(<PendingLabel>Blog</PendingLabel>)).toBe(
      "<span>Blog</span>",
    );
  });

  it("is underlined from the click until the page arrives", () => {
    status.pending = true;
    const markup = renderToStaticMarkup(<PendingLabel>Blog</PendingLabel>);
    expect(markup).toContain('data-pending="true"');
    expect(markup).toContain("underline decoration-2 underline-offset-[3px]");
    expect(markup).not.toMatch(/animate-|transition/);
  });
});
