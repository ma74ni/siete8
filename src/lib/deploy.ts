/**
 * Whether this build is Netlify's production deploy. Netlify sets `CONTEXT`
 * only while building, so the server never sees it when it renders a page
 * again; `next.config.ts` copies it at build time into
 * `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, which is inlined in the code.
 */
export function isProductionDeploy(environment: string | undefined): boolean {
  return environment === "production";
}
