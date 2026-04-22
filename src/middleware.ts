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
    try {
      const isMaintenance = process.env.MAINTENANCE_MODE === "true";
      
      // EXEMPT AUTH PATHS: Even in maintenance, we must allow login
      const isAuthPath = 
        pathname === "/login" || 
        pathname === "/register" || 
        pathname === "/verify" || 
        pathname.startsWith("/forgot-password") || 
        pathname.startsWith("/reset-password") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/register") ||
        pathname.startsWith("/api/verify");

      if (isMaintenance && !isAuthPath) {
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