import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_FORBIDDEN, decideAdminAccess } from "@/lib/admin-access";
import { createProxyClient, hasSessionCookie } from "@/server/supabase/proxy";

/**
 * Protects the panel (RNF-18): refreshes the Supabase session, sends visitors
 * without a session to the login and answers 403 to users without the admin
 * role. The panel checks again with `requireAdmin()`; this is the first line.
 */
export async function proxy(request: NextRequest) {
  const { supabase, response, withSessionCookies } = createProxyClient(request);

  // Validates the token (and refreshes it if needed) before anything else.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = data !== null;

  let isAdmin = false;
  if (isSignedIn) {
    const { data: result, error } = await supabase.rpc("is_admin");
    isAdmin = !error && result === true;
  }

  const access = decideAdminAccess({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    isSignedIn,
    hadSession: hasSessionCookie(request),
    isAdmin,
  });

  let result: NextResponse;
  if (access.type === "redirect") {
    result = withSessionCookies(
      NextResponse.redirect(new URL(access.to, request.url)),
    );
  } else if (access.type === "forbidden") {
    result = withSessionCookies(
      NextResponse.rewrite(new URL(ADMIN_FORBIDDEN, request.url), {
        request,
        status: 403,
      }),
    );
  } else {
    result = response();
  }

  // Panel responses depend on the session: never cache them.
  result.headers.set("cache-control", "private, no-store");
  return result;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
