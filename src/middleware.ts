import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // 1. Skip check for static files and common assets
    if (
      pathname.startsWith("/_next") || 
      pathname.startsWith("/api/admin/maintenance") || 
      pathname.startsWith("/maintenance") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // 2. Check for Maintenance Mode via Environment Variable or DB
    // To avoid DB overhead in middleware, we check the ENV variable first.
    // If you want pure DB control, we'd need to fetch from Prisma here.
    // For now, let's implement the logic assuming we'll check the DB status.
    try {
      // In Next.js Middleware, we can't use the standard Prisma client easily if it's not Edge-compatible.
      // So we will use a lightweight fetch to our own internal API if needed, or rely on a simple ENV for now.
      // But wait, we can just fetch the status from our own API route!
      const isMaintenance = process.env.MAINTENANCE_MODE === "true";
      
      // If we want it to be dynamic via DB, we can use an internal API call:
      // const res = await fetch(`${req.nextUrl.origin}/api/admin/maintenance`);
      // const settings = await res.json();
      
      // Let's use a hybrid: ENV variable takes precedence for hard-shutdown, 
      // but we'll also allow DB-driven lockdown.
      
      // For the most robust middleware, we should avoid async fetches if possible.
      // Let's implement Phase 2: Check for a Maintenance Mode via the environment variable first.
      if (isMaintenance) {
        const isAdmin = req.nextauth.token?.isAdmin;
        if (!isAdmin) {
          if (pathname.startsWith("/api/")) {
            return new NextResponse(
              JSON.stringify({ error: "System is in maintenance mode" }),
              { status: 503, headers: { "Content-Type": "application/json" } }
            );
          }
          return NextResponse.redirect(new URL("/maintenance", req.url));
        }
      }
    } catch (e) {
      console.error("Middleware maintenance check failed", e);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Allow access to login, register, verify, forgot-password, reset-password, and public assets without auth
        if (
          pathname === "/login" || 
          pathname === "/register" || 
          pathname === "/verify" || 
          pathname.startsWith("/forgot-password") || 
          pathname.startsWith("/reset-password") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/register") ||
          pathname.startsWith("/api/verify") ||
          pathname === "/maintenance" ||
          pathname.includes(".")
        ) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/admin/maintenance (maintenance control)
     * - maintenance (the page itself)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/admin/maintenance|maintenance|_next/static|_next/image|favicon.ico).*)",
  ],
};