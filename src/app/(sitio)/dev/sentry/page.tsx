import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Floor } from "@/components/sitio/floor";
import { serverEnv } from "@/env/server";

import { ThrowButtons } from "./throw-buttons";

/*
 * Forced errors to check Sentry (E7-06). Like /dev/ui: visible with
 * `pnpm dev` and in deploy previews, 404 in production. With
 * NEXT_PUBLIC_SENTRY_DSN in .env.local, both errors show in Sentry with their
 * route. Developer-only page: not in docs/COPY.md.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SentryTestPage() {
  if (serverEnv.CONTEXT === "production") notFound();
  return (
    <Floor>
      <div className="flex flex-col items-start gap-6">
        <h1>Prueba de Sentry</h1>
        <ThrowButtons />
      </div>
    </Floor>
  );
}
