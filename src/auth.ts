import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { getActiveMembership, isDeactivatedUser } from "@/lib/membership";
import {
  clearLoginFailures,
  loginAttemptBlocked,
  recordLoginFailure,
} from "@/lib/login-throttle";

class DeactivatedSignin extends CredentialsSignin {
  code = "deactivated";
}

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

let dummyPasswordHash: string | null = null;

async function compareDummyPassword(password: string) {
  dummyPasswordHash ??= await bcrypt.hash("login-throttle-dummy", 10);
  await bcrypt.compare(password, dummyPasswordHash);
}

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        if (loginAttemptBlocked(email)) {
          throw new RateLimitedSignin();
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          await compareDummyPassword(password);
          recordLoginFailure(email);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          recordLoginFailure(email);
          return null;
        }
        clearLoginFailures(email);

        if (await isDeactivatedUser(user.id)) {
          throw new DeactivatedSignin();
        }

        const membership = await getActiveMembership(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership?.organizationId,
          role: membership?.role,
          isPlatformAdmin: user.isPlatformAdmin,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.isPlatformAdmin = user.isPlatformAdmin;
      }

      if (token.sub) {
        const [membership, dbUser] = await Promise.all([
          getActiveMembership(token.sub),
          prisma.user.findUnique({
            where: { id: token.sub },
            select: { isPlatformAdmin: true },
          }),
        ]);
        token.organizationId = membership?.organizationId;
        token.role = membership?.role;
        token.isPlatformAdmin = dbUser?.isPlatformAdmin ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.organizationId = token.organizationId as string | undefined;
        session.user.role = token.role as typeof session.user.role;
        session.user.isPlatformAdmin = Boolean(token.isPlatformAdmin);
      }
      return session;
    },
  },
});
