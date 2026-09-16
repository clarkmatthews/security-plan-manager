import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export function proxy(request: NextRequest) {
  return (
    auth as unknown as (req: NextRequest) => ReturnType<typeof auth>
  )(request);
}

export const config = {
  matcher: ["/app/:path*", "/onboarding"],
};
