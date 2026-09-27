import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv } from "@/env/client";
import type { Database } from "@/lib/database.types";

/**
 * Client for `src/proxy.ts`. Refreshed tokens are written both to the request
 * (so the page rendered next sees them) and to `response`, which the proxy
 * must return or copy with `withSessionCookies`.
 */
export function createProxyClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  return {
    supabase,
    /** The pass-through response, with any refreshed session cookies. */
    response: () => response,
    /** Copies refreshed session cookies and cache headers to `target`. */
    withSessionCookies<T extends NextResponse>(target: T): T {
      for (const cookie of response.cookies.getAll()) {
        target.cookies.set(cookie);
      }
      for (const key of ["cache-control", "expires", "pragma"]) {
        const value = response.headers.get(key);
        if (value) target.headers.set(key, value);
      }
      return target;
    },
  };
}

/** True when the request carries Supabase auth cookies, valid or not. */
export function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => /^sb-.+-auth-token(\.\d+)?$/.test(name));
}
