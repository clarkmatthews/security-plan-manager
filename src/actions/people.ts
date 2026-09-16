"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { unstable_update } from "@/auth";
import { requireMembership } from "@/lib/auth-guard";
import { isOwnerRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { activeOwnerCount } from "@/lib/membership";

export type PeopleState = { error?: string; ok?: boolean } | undefined;

const roleSchema = z.object({
  membershipId: z.string().min(1),
  role: z.string().min(1).max(48),
});

export async function updateMemberRoleAction(
  _prev: PeopleState,
  formData: FormData,
): Promise<PeopleState> {
  const actor = await requireMembership();
  if (!actor.permissions.PEOPLE.edit) {
    return { error: "You cannot manage people in this organization." };
  }

  const parsed = roleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: "Choose a valid role." };
  }

  const orgRole = await prisma.organizationRole.findUnique({
    where: {
      organizationId_key: {
        organizationId: actor.organizationId,
        key: parsed.data.role,
      },
    },
  });
  if (!orgRole) {
    return { error: "Choose a valid role." };
  }

  if (isOwnerRole(parsed.data.role) && !actor.isOwner && !actor.isPlatformAdmin) {
    return { error: "Only owners can assign the owner role." };
  }

  const target = await prisma.membership.findFirst({
    where: { id: parsed.data.membershipId, organizationId: actor.organizationId },
  });
  if (!target) {
    return { error: "That person was not found." };
  }

  if (isOwnerRole(target.role) && !actor.isOwner && !actor.isPlatformAdmin) {
    return { error: "Only owners can change another owner." };
  }

  if (isOwnerRole(target.role) && !isOwnerRole(parsed.data.role)) {
    const remaining = await activeOwnerCount(actor.organizationId, target.id);
    if (remaining < 1) {
      return { error: "Keep at least one active organization owner." };
    }
  }

  await prisma.membership.update({
    where: { id: target.id },
    data: { role: parsed.data.role },
  });

  if (target.userId === actor.userId) {
    await unstable_update({
      user: { organizationId: actor.organizationId, role: parsed.data.role },
    });
  }

  revalidatePath("/app", "layout");
  revalidatePath("/app/settings/people");
  return { ok: true };
}

export async function setMemberActiveAction(
  membershipId: string,
  active: boolean,
): Promise<PeopleState> {
  const actor = await requireMembership();
  if (!actor.permissions.PEOPLE.edit) {
    return { error: "You cannot manage people in this organization." };
  }

  const target = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: actor.organizationId },
  });
  if (!target) {
    return { error: "That person was not found." };
  }

  if (isOwnerRole(target.role) && !actor.isOwner && !actor.isPlatformAdmin) {
    return { error: "Only owners can change another owner." };
  }

  if (target.userId === actor.userId) {
    return { error: "You cannot deactivate your own account." };
  }

  if (target.active && !active && isOwnerRole(target.role)) {
    const remaining = await activeOwnerCount(actor.organizationId, target.id);
    if (remaining < 1) {
      return { error: "Keep at least one active organization owner." };
    }
  }

  await prisma.membership.update({
    where: { id: target.id },
    data: { active },
  });

  revalidatePath("/app", "layout");
  revalidatePath("/app/settings/people");
  return { ok: true };
}
