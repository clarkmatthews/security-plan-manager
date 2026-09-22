import { prisma } from "@/lib/prisma";

const INVITE_PATH = /^\/invite\/([a-f0-9]{48})$/;

export function inviteTokenFromCallback(callbackUrl: string) {
  return INVITE_PATH.exec(callbackUrl)?.[1] ?? null;
}

export async function organizationExists() {
  const count = await prisma.organization.count();
  return count > 0;
}

export async function signupPermitted(email: string, callbackUrl: string) {
  const token = inviteTokenFromCallback(callbackUrl);
  if (token) {
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return false;
    return invite.email.toLowerCase() === email;
  }
  return !(await organizationExists());
}
