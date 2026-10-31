import { Floor } from "@/components/sitio/floor";

// Texts from docs/COPY.md §2 (Estados).

/**
 * Shown while the next page arrives, so a click answers at once even when the
 * server is slow. Static blocks in `surface`, with no animation: the hero is
 * the site's only automatic one (DESIGN).
 */
export default function Loading() {
  return (
    <Floor fitScreen className="min-h-[calc(100svh-4.5rem)]">
      <div role="status" className="flex w-full flex-col gap-5">
        <span className="sr-only">Cargando la página.</span>
        <div aria-hidden className="flex flex-col gap-5">
          <div className="h-12 w-2/3 max-w-xl rounded-control bg-surface lg:h-16" />
          <div className="h-4 w-full max-w-2xl rounded-control bg-surface" />
          <div className="h-4 w-full max-w-2xl rounded-control bg-surface" />
          <div className="h-4 w-1/2 max-w-md rounded-control bg-surface" />
        </div>
      </div>
    </Floor>
  );
}
