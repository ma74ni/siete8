"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { Button } from "@/components/sitio/button";

import "./globals.css";

// Texts from docs/COPY.md §11. Replaces the root layout when it fails, so it
// brings its own html and body; the error goes to Sentry (E7-06).

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es-EC">
      <body>
        <main className="mx-auto flex min-h-dvh max-w-[64rem] flex-col items-start justify-center gap-6 px-5 py-12">
          <h1>Algo salió mal</h1>
          <p>
            Tuvimos un problema al cargar esta página. Inténtalo de nuevo; si
            sigue fallando, escríbenos por WhatsApp.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => retry()}>Intentar de nuevo</Button>
            <Button href="/" variant="secondary">
              Ir al inicio
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
