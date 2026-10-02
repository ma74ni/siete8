import "server-only";

/**
 * Whether a request comes from a page of this site: browsers send `Origin`
 * on POST requests, so a form or script on another site is rejected.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
