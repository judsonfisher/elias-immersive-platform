import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Lightweight middleware that decodes the JWT session token directly
// instead of importing the full auth config (which pulls in Prisma/bcrypt
// and exceeds the Vercel Edge Function size limit).

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ""
);

async function getToken(req: NextRequest) {
  // Auth.js v5 stores the session in a cookie named
  // __Secure-authjs.session-token (production) or authjs.session-token (dev)
  const secureCookie = req.cookies.get("__Secure-authjs.session-token");
  const devCookie = req.cookies.get("authjs.session-token");
  const tokenValue = secureCookie?.value || devCookie?.value;

  if (!tokenValue) return null;

  try {
    const { payload } = await jwtVerify(tokenValue, SECRET, {
      algorithms: ["HS256"],
    });
    return payload as { role?: string; email?: string };
  } catch {
    return null;
  }
}

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

  const token = await getToken(req);
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
