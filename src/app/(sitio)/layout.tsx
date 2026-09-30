import type { ReactNode } from "react";

import { SiteShell } from "@/components/sitio/layout/site-shell";

// Every public page is regenerated at least hourly: a scheduled article
// (E4-05) shows up on its date without anyone saving in the panel. Panel
// saves still regenerate at once (revalidatePath).
export const revalidate = 3600;

/** Public site: header, content, footer and the floating WhatsApp button. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
