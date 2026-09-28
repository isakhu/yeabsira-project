import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { canAccessRoute, ROLE_DASHBOARD_ROUTES, type Role } from "@/lib/permissions";

// Routes accessible during forced password change
const PASSWORD_CHANGE_ROUTES = [
  "/change-password",
  "/api/auth/change-password",
  "/api/auth/logout",
  "/api/auth/me",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // Get session from encrypted cookie
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  const isLoggedIn = session.isLoggedIn === true;

  // Authenticated user visiting /signin → redirect to role dashboard
  if (pathname === "/signin") {
    console.log("[MIDDLEWARE] /signin check — isLoggedIn:", isLoggedIn, "role:", session.role);
    if (isLoggedIn) {
      if (session.mustChangePassword) {
        return NextResponse.redirect(new URL("/change-password", request.url));
      }
      const dashboardUrl = ROLE_DASHBOARD_ROUTES[session.role as Role] || "/admin";
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    return NextResponse.next();
  }

  // Allow public homepage and login API
  if (pathname === "/" || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  // Unauthenticated user trying to access protected route
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("expired", "true");
    return NextResponse.redirect(signinUrl);
  }

  // Forced password change enforcement
  if (session.mustChangePassword) {
    if (PASSWORD_CHANGE_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  // Authenticated user visiting /dashboard → redirect to role dashboard
  if (pathname === "/dashboard") {
    const dashboardUrl = ROLE_DASHBOARD_ROUTES[session.role as Role] || "/admin";
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // Role-based route protection
  if (!canAccessRoute(session.role as Role, pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
