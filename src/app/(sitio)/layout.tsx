import type { ReactNode } from "react";

import { SiteShell } from "@/components/sitio/layout/site-shell";

/** Public site: header, content, footer and the floating WhatsApp button. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
