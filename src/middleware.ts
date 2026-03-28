import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/students",
  "/courses",
  "/transcripts",
  "/billing",
  "/settings",
  "/dashboard",
];

// Routes that are always public
const publicRoutes = ["/", "/api/auth", "/api/health", "/api/webhooks"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session token (NextAuth.js v5 uses this cookie)
  const sessionToken =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  // Redirect unauthenticated users from protected routes
  if (
    protectedRoutes.some((route) => pathname.startsWith(route)) &&
    !sessionToken
  ) {
    const signInUrl = new URL("/api/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and _next
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
