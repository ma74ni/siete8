export const ADMIN_HOME = "/admin";
export const ADMIN_LOGIN = "/admin/login";
/** Internal route rendered with a 403 status; its URL is never shown. */
export const ADMIN_FORBIDDEN = "/admin/acceso-denegado";

export type AdminAccess =
  { type: "allow" } | { type: "redirect"; to: string } | { type: "forbidden" };

/**
 * Returns `value` only when it is a path inside the panel, so the `next`
 * parameter of the login page cannot redirect to another site.
 */
export function safeAdminPath(value: unknown): string {
  if (typeof value !== "string") return ADMIN_HOME;
  if (!/^\/admin(\/|\?|$)/.test(value)) return ADMIN_HOME;
  // Backslashes and encoded slashes can turn a path into another host.
  if (/[\\]|%2f|%5c/i.test(value)) return ADMIN_HOME;
  const url = new URL(value, "http://siete8.local");
  if (url.origin !== "http://siete8.local") return ADMIN_HOME;
  // Checked again after `..` segments are resolved.
  if (!/^\/admin(\/|$)/.test(url.pathname)) return ADMIN_HOME;
  if (url.pathname === ADMIN_LOGIN) return ADMIN_HOME;
  return `${url.pathname}${url.search}`;
}

export function loginPath(next: string, expired: boolean): string {
  const params = new URLSearchParams();
  if (next !== ADMIN_HOME) params.set("next", next);
  if (expired) params.set("motivo", "sesion-caducada");
  const query = params.toString();
  return query ? `${ADMIN_LOGIN}?${query}` : ADMIN_LOGIN;
}

/**
 * Decides what the proxy does with a request under `/admin`.
 *
 * - `hadSession`: the request carried Supabase auth cookies, so a missing
 *   session means it expired.
 * - `isAdmin`: only needed when there is a session.
 */
export function decideAdminAccess(input: {
  pathname: string;
  search: string;
  isSignedIn: boolean;
  hadSession: boolean;
  isAdmin: boolean;
}): AdminAccess {
  const { pathname, search, isSignedIn, hadSession, isAdmin } = input;

  if (pathname === ADMIN_LOGIN) {
    if (isSignedIn && isAdmin) {
      const next = new URLSearchParams(search).get("next");
      return { type: "redirect", to: safeAdminPath(next) };
    }
    return { type: "allow" };
  }

  if (!isSignedIn) {
    const next = safeAdminPath(`${pathname}${search}`);
    return { type: "redirect", to: loginPath(next, hadSession) };
  }

  return isAdmin ? { type: "allow" } : { type: "forbidden" };
}
