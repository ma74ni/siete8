import type { Metadata } from "next";

import { Button } from "@/components/sitio/button";
import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";
import { SiteShell } from "@/components/sitio/layout/site-shell";

// Texts from docs/COPY.md §11. Root level so it also answers unmatched URLs.

export const metadata: Metadata = {
  title: "Página no encontrada | Siete8",
};

export default function NotFound() {
  return (
    <SiteShell>
      <Floor>
        <div className="flex max-w-[68ch] flex-col items-start gap-6">
          <h1>No encontramos esta página</h1>
          <p>
            Puede que el enlace esté mal escrito o que la página ya no exista.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button href="/">Ir al inicio</Button>
            <Button href="/servicios" variant="secondary">
              Ver servicios
            </Button>
          </div>
        </div>
      </Floor>
      <Closing />
    </SiteShell>
  );
}
