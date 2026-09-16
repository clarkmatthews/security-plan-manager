import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/app") || pathname.startsWith("/onboarding");
      if (isProtected && !isLoggedIn) {
        return false;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
