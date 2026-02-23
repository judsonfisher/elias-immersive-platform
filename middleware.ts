import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/forgot-password"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isInviteRoute = pathname.startsWith("/invite");
  const isResetRoute = pathname.startsWith("/reset-password");
  const isAuthApi = pathname.startsWith("/api/auth");

  const isShareRoute = pathname.startsWith("/share");
  const isEmbedRoute = pathname.startsWith("/embed");

  // Allow API auth routes
  if (isAuthApi) return NextResponse.next();

  // Allow public routes with their own token/key validation
  if (isInviteRoute || isResetRoute || isShareRoute || isEmbedRoute) {
    return NextResponse.next();
  }

  // On HTTPS (production), Auth.js v5 sets cookies with __Secure- prefix.
  // getToken defaults secureCookie to false, so we must detect HTTPS and pass it.
  const secureCookie = req.nextUrl.protocol === "https:";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    secureCookie,
  });
  const isLoggedIn = !!token;

  // Redirect logged-in users away from login page
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect non-admin users away from admin routes
  if (isLoggedIn && pathname.startsWith("/admin") && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes (except auth)
    "/((?!_next/static|_next/image|favicon.ico|logo\\.svg|logo\\.png|api/(?!auth)).*)",
  ],
};
