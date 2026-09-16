import { prisma } from "@/lib/prisma";

export async function getActiveMembership(userId: string) {
  return prisma.membership.findFirst({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function isDeactivatedUser(userId: string) {
  const active = await getActiveMembership(userId);
  if (active) return false;
  const count = await prisma.membership.count({ where: { userId } });
  return count > 0;
}

export async function activeOwnerCount(
  organizationId: string,
  exceptMembershipId?: string,
) {
  return prisma.membership.count({
    where: {
      organizationId,
      role: "ORG_OWNER",
      active: true,
      ...(exceptMembershipId ? { id: { not: exceptMembershipId } } : {}),
    },
  });
}
