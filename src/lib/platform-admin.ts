import { prisma } from "@/lib/prisma";

/**
 * Config is limited to platform admins. If the deployment has none yet, the
 * earliest organization owner is designated, then the earliest CISO.
 */
export async function resolvePlatformAdmin(userId: string) {
  const self = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPlatformAdmin: true },
  });
  if (self?.isPlatformAdmin) return true;

  const existing = await prisma.user.findFirst({
    where: { isPlatformAdmin: true },
    select: { id: true },
  });
  if (existing) return false;

  const owner = await prisma.membership.findFirst({
    where: { role: "ORG_OWNER", active: true },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });
  const fallback = owner
    ? null
    : await prisma.membership.findFirst({
        where: { role: "CISO", active: true },
        orderBy: { createdAt: "asc" },
        select: { userId: true },
      });
  const chosenId = owner?.userId ?? fallback?.userId;
  if (!chosenId) return false;

  await prisma.user.updateMany({
    where: { id: chosenId, isPlatformAdmin: false },
    data: { isPlatformAdmin: true },
  });
  return chosenId === userId;
}
