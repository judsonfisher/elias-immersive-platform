import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/forgot-password"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isInviteRoute = pathname.startsWith("/invite");
  const isResetRoute = pathname.startsWith("/reset-password");
  const isAuthApi = pathname.startsWith("/api/auth");

  // Allow API auth routes and public routes
  if (isAuthApi) return NextResponse.next();

  // Allow invite and reset-password routes (they have their own token validation)
  if (isInviteRoute || isResetRoute) return NextResponse.next();

  // Redirect logged-in users away from login page
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect non-admin users away from admin routes
  if (isLoggedIn && pathname.startsWith("/admin") && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and API routes (except auth)
    "/((?!_next/static|_next/image|favicon.ico|logo\\.svg|logo\\.png|api/(?!auth)).*)",
  ],
};
