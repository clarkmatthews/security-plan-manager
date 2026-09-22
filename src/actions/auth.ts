"use server";

import bcrypt from "bcryptjs";
import { AuthError, CredentialsSignin } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signupPermitted } from "@/lib/signup-policy";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).optional(),
});

export type AuthState = { error?: string } | undefined;

function safeCallback(formData: FormData, fallback: string) {
  const value = String(formData.get("callbackUrl") ?? "");
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const callbackUrl = safeCallback(formData, "/onboarding");
  if (!(await signupPermitted(email, callbackUrl))) {
    return {
      error: "Accounts are created from an invite, or by the first person to set up this deployment.",
    };
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Could not create that account. If you already registered, sign in." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
    },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try logging in." };
    }
    throw error;
  }
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallback(formData, "/app"),
    });
  } catch (error) {
    if (error instanceof CredentialsSignin || error instanceof AuthError) {
      const code =
        "code" in error && typeof error.code === "string" ? error.code : "";
      if (code === "deactivated") {
        return { error: "This account has been deactivated. Contact an organization owner." };
      }
      if (code === "rate_limited") {
        return { error: "Too many sign-in attempts. Try again in a few minutes." };
      }
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
