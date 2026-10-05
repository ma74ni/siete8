"use client";

import { useState } from "react";

import { Button } from "@/components/sitio/button";

import { throwOnServer } from "./actions";

/** One error in the browser, one in a Server Action. */
export function ThrowButtons() {
  const [sent, setSent] = useState("");
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => {
            setSent("Error del navegador enviado.");
            setTimeout(() => {
              throw new Error("Sentry test: browser error");
            });
          }}
        >
          Error en el navegador
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            await throwOnServer().catch(() => undefined);
            setSent("Error del servidor enviado.");
          }}
        >
          Error en el servidor
        </Button>
      </div>
      {sent && <p role="status">{sent}</p>}
    </div>
  );
}
