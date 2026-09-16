"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { unstable_update } from "@/auth";
import { requireMembership, requireSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isOwnerRole } from "@/lib/rbac";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.string().min(1).max(48),
});

export type InviteState = { error?: string; ok?: boolean; token?: string } | undefined;

export async function createInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const membership = await requireMembership();
  if (!membership.permissions.PEOPLE.edit) {
    return { error: "You cannot invite people in this organization." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and role." };
  }

  const orgRole = await prisma.organizationRole.findUnique({
    where: {
      organizationId_key: {
        organizationId: membership.organizationId,
        key: parsed.data.role,
      },
    },
  });
  if (!orgRole) {
    return { error: "Enter a valid email and role." };
  }

  if (isOwnerRole(parsed.data.role) && !membership.isOwner && !membership.isPlatformAdmin) {
    return { error: "Only owners can invite another owner." };
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.invite.create({
    data: {
      organizationId: membership.organizationId,
      email: parsed.data.email.toLowerCase().trim(),
      role: parsed.data.role,
      token,
      expiresAt,
      invitedById: membership.userId,
    },
  });

  return { ok: true, token };
}

export async function acceptInviteAction(token: string) {
  const session = await requireSession();
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    redirect("/login?error=invite");
  }

  const email = session.user.email?.toLowerCase();
  if (email && email !== invite.email) {
    redirect("/login?error=invite-email");
  }

  const orgRole = await prisma.organizationRole.findUnique({
    where: {
      organizationId_key: {
        organizationId: invite.organizationId,
        key: invite.role,
      },
    },
  });
  if (!orgRole) {
    redirect("/login?error=invite");
  }

  await prisma.$transaction(async (tx) => {
    await tx.membership.upsert({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: invite.organizationId,
        },
      },
      update: { role: invite.role, active: true },
      create: {
        userId: session.user.id,
        organizationId: invite.organizationId,
        role: invite.role,
        active: true,
      },
    });
    await tx.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  await unstable_update({
    user: {
      organizationId: invite.organizationId,
      role: invite.role,
    },
  });

  redirect("/app");
}

export async function getInviteLink(token: string) {
  return `/invite/${token}`;
}
