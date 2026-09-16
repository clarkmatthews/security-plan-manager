import { redirect, notFound } from "next/navigation";
import { auth, signOut } from "@/auth";
import {
  hasAccess,
  homePath,
  isOwnerRole,
  roleDisplayName,
  type AccessLevel,
  type PermissionMap,
  type ProductAreaCode,
} from "@/lib/rbac";
import { loadPermissionMap } from "@/lib/role-permissions";
import { getActiveMembership, isDeactivatedUser } from "@/lib/membership";
import { loadRoleBrandScope, scopeToAccess, hasBrandAccess, type BrandAccessMembership } from "@/lib/brand-access";
import { ensureOrganizationRoles } from "@/lib/org-roles";
import { prisma } from "@/lib/prisma";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function requireMembership(allowed?: string[]) {
  const session = await requireSession();
  const membership = await getActiveMembership(session.user.id);

  if (!membership) {
    if (await isDeactivatedUser(session.user.id)) {
      await signOut({ redirectTo: "/login?error=deactivated" });
    }
    redirect("/onboarding");
  }

  await ensureOrganizationRoles(membership.organizationId);

  const [permissions, brandScope, orgRole] = await Promise.all([
    loadPermissionMap(
      membership.organizationId,
      membership.role,
      Boolean(session.user.isPlatformAdmin),
    ),
    loadRoleBrandScope(membership.organizationId, membership.role),
    prisma.organizationRole.findUnique({
      where: {
        organizationId_key: {
          organizationId: membership.organizationId,
          key: membership.role,
        },
      },
      select: { name: true },
    }),
  ]);

  if (
    allowed &&
    !allowed.includes(membership.role) &&
    !session.user.isPlatformAdmin
  ) {
    redirect(homePath(permissions));
  }

  const brandAccess = scopeToAccess(
    membership.organizationId,
    Boolean(session.user.isPlatformAdmin),
    brandScope,
  );

  return {
    userId: session.user.id,
    membershipId: membership.id,
    organizationId: membership.organizationId,
    role: membership.role,
    roleName: roleDisplayName(membership.role, orgRole?.name),
    isOwner: isOwnerRole(membership.role),
    isPlatformAdmin: brandAccess.isPlatformAdmin,
    allBrands: brandAccess.allBrands,
    allowedBrandIds: brandAccess.allowedBrandIds,
    permissions,
    canEdit: hasAccess(permissions, "ASSESSMENT", "edit"),
    canInvite: hasAccess(permissions, "PEOPLE", "edit"),
    canPublish: hasAccess(permissions, "REPORTS", "edit"),
    isExec: !hasAccess(permissions, "PROGRAM", "view"),
    name: session.user.name,
    email: session.user.email,
  };
}

export async function requireArea(area: ProductAreaCode, level: AccessLevel = "view") {
  const membership = await requireMembership();
  if (!hasAccess(membership.permissions, area, level)) {
    redirect(homePath(membership.permissions));
  }
  return membership;
}

export function requireBrandAccess(
  membership: BrandAccessMembership,
  brandId: string,
) {
  if (!hasBrandAccess(membership, brandId)) {
    notFound();
  }
}

export function can(
  permissions: PermissionMap,
  area: ProductAreaCode,
  level: AccessLevel,
) {
  return hasAccess(permissions, area, level);
}
