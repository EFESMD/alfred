import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/workspaces/:path*", 
    "/projects/:path*", 
    "/tasks/:path*",
    "/profile/:path*",
    "/settings/:path*"
  ],
};