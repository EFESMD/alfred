import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    isAdmin?: boolean;
  }
}
