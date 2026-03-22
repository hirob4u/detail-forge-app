import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/estimate/",
  "/api/intake/",
  "/api/uploads/",
  "/api/invites/",
  "/quote/",
  "/api/quote/",
];

const AUTH_PATHS = ["/sign-in", "/sign-up", "/waitlist", "/forgot-password", "/reset-password"];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/jobs",
  "/customers",
  "/supplies",
  "/settings",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes -- pass through
  if (
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // Fast cookie check
  const sessionCookie = getSessionCookie(request);

  // Redirect /sign-up without invite code to waitlist
  if (pathname === "/sign-up" && !request.nextUrl.searchParams.get("code")) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  // Auth pages: redirect to dashboard if already authenticated
  if (isAuth) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected pages: redirect to sign-in if not authenticated
  if (isProtected) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Get full session to check activeOrganizationId
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      // Auto-activate org if session has no active org
      if (!session.session.activeOrganizationId) {
        try {
          const response = await fetch(
            new URL("/api/auth/organization/list", request.url),
            { headers: request.headers },
          );
          const data = await response.json();
          const firstOrg = data?.[0];

          if (firstOrg?.id) {
            await fetch(
              new URL("/api/auth/organization/set-active", request.url),
              {
                method: "POST",
                headers: {
                  ...Object.fromEntries(request.headers),
                  "content-type": "application/json",
                },
                body: JSON.stringify({ organizationId: firstOrg.id }),
              },
            );
          }
        } catch (err) {
          // Silent fail -- the dashboard will show the no-org state
          // and the user can refresh to retry
          console.error("Auto-org activation failed:", err);
        }
      }
    } catch {
      // Session validation failed -- let the page handle it
    }

    return NextResponse.next();
  }

  // All other routes (API routes not in public list, etc.)
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|fonts/).*)"],
};
