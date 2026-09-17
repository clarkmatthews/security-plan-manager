import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  OWNER_ROLE_KEY,
  SYSTEM_ROLES,
  roleDisplayName,
  roleKeyFromName,
} from "@/lib/rbac";

type Db = PrismaClient | Prisma.TransactionClient;

export type OrgRole = {
  key: string;
  name: string;
  locked: boolean;
  sortOrder: number;
  assignedCount: number;
  pendingInviteCount: number;
};

export type RoleActionResult =
  | { ok: true; key: string }
  | { ok: false; error: string };

export async function renameLegacyCsoIdentity(db: Db = prisma) {
  const legacyUser = await db.user.findUnique({
    where: { email: "cso@apex.example" },
    select: { id: true },
  });
  const taken = await db.user.findUnique({
    where: { email: "ciso@apex.example" },
    select: { id: true },
  });
  if (legacyUser && !taken) {
    await db.user.update({
      where: { id: legacyUser.id },
      data: { email: "ciso@apex.example" },
    });
  }

  const legacyRoles = await db.organizationRole.findMany({
    where: { key: "CSO" },
    select: { id: true, organizationId: true },
  });
  for (const role of legacyRoles) {
    await renameOrganizationRoleKey(role.organizationId, "CSO", "CISO", "CISO", db);
  }
}

async function renameOrganizationRoleKey(
  organizationId: string,
  fromKey: string,
  toKey: string,
  toName: string,
  db: Db,
) {
  const current = await db.organizationRole.findUnique({
    where: { organizationId_key: { organizationId, key: fromKey } },
  });
  if (!current) return;

  const dest = await db.organizationRole.findUnique({
    where: { organizationId_key: { organizationId, key: toKey } },
  });

  await db.membership.updateMany({
    where: { organizationId, role: fromKey },
    data: { role: toKey },
  });
  await db.invite.updateMany({
    where: { organizationId, role: fromKey },
    data: { role: toKey },
  });

  const destPermissions = dest
    ? await db.rolePermission.findMany({
        where: { organizationId, role: toKey },
        select: { area: true },
      })
    : [];
  const destAreas = new Set(destPermissions.map((row) => row.area));
  const sourcePermissions = await db.rolePermission.findMany({
    where: { organizationId, role: fromKey },
  });
  for (const row of sourcePermissions) {
    if (destAreas.has(row.area)) {
      await db.rolePermission.delete({ where: { id: row.id } });
      continue;
    }
    await db.rolePermission.update({
      where: { id: row.id },
      data: { role: toKey },
    });
  }

  const sourceScope = await db.roleBrandScope.findUnique({
    where: { organizationId_role: { organizationId, role: fromKey } },
  });
  const destScope = await db.roleBrandScope.findUnique({
    where: { organizationId_role: { organizationId, role: toKey } },
  });
  if (sourceScope && !destScope) {
    await db.roleBrandScope.update({
      where: { id: sourceScope.id },
      data: { role: toKey },
    });
  } else if (sourceScope && destScope) {
    await db.roleBrandScope.delete({ where: { id: sourceScope.id } });
  }

  if (dest) {
    await db.organizationRole.delete({ where: { id: current.id } });
    return;
  }

  await db.organizationRole.update({
    where: { id: current.id },
    data: { key: toKey, name: current.name === "CSO" ? toName : current.name },
  });
}

export async function ensureOrganizationRoles(organizationId: string, db: Db = prisma) {
  await renameLegacyCsoIdentity(db);
  const existing = await db.organizationRole.findMany({
    where: { organizationId },
  });

  if (existing.length === 0) {
    await db.organizationRole.createMany({
      data: SYSTEM_ROLES.map((role) => ({
        organizationId,
        key: role.key,
        name: role.name,
        locked: role.locked,
        sortOrder: role.sortOrder,
      })),
      skipDuplicates: true,
    });
    return;
  }

  const owner = existing.find((role) => role.key === OWNER_ROLE_KEY);
  if (!owner) {
    await db.organizationRole.create({
      data: {
        organizationId,
        key: OWNER_ROLE_KEY,
        name: "Organization owner",
        locked: true,
        sortOrder: 0,
      },
    });
    return;
  }

  if (!owner.locked) {
    await db.organizationRole.update({
      where: { id: owner.id },
      data: { locked: true },
    });
  }
}

export async function listRoleKeys(organizationId: string, db: Db = prisma) {
  await ensureOrganizationRoles(organizationId, db);
  const roles = await db.organizationRole.findMany({
    where: { organizationId },
    select: { key: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return roles.map((role) => role.key);
}

export async function listOrganizationRoles(
  organizationId: string,
  db: Db = prisma,
): Promise<OrgRole[]> {
  await ensureOrganizationRoles(organizationId, db);
  const [roles, memberships, invites] = await Promise.all([
    db.organizationRole.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.membership.groupBy({
      by: ["role"],
      where: { organizationId },
      _count: { _all: true },
    }),
    db.invite.groupBy({
      by: ["role"],
      where: { organizationId, acceptedAt: null },
      _count: { _all: true },
    }),
  ]);

  const assigned = new Map(memberships.map((row) => [row.role, row._count._all]));
  const pending = new Map(invites.map((row) => [row.role, row._count._all]));

  return roles.map((role) => ({
    key: role.key,
    name: role.name,
    locked: role.locked,
    sortOrder: role.sortOrder,
    assignedCount: assigned.get(role.key) ?? 0,
    pendingInviteCount: pending.get(role.key) ?? 0,
  }));
}

export async function roleNameFor(
  organizationId: string,
  key: string,
  db: Db = prisma,
) {
  const role = await db.organizationRole.findUnique({
    where: { organizationId_key: { organizationId, key } },
    select: { name: true },
  });
  return roleDisplayName(key, role?.name);
}

export async function createOrganizationRole(
  organizationId: string,
  name: string,
  copyFromKey?: string,
): Promise<RoleActionResult> {
  await ensureOrganizationRoles(organizationId);
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { ok: false, error: "Enter a role name." };
  }
  if (trimmed.length > 60) {
    return { ok: false, error: "Role names must be 60 characters or fewer." };
  }

  let key = roleKeyFromName(trimmed);
  if (key === "PLATFORM_ADMIN" || key === OWNER_ROLE_KEY) {
    key = `CUSTOM_${key}`;
  }

  const existing = await prisma.organizationRole.findMany({
    where: { organizationId },
    select: { key: true },
  });
  const existingKeys = new Set(existing.map((role) => role.key));
  if (existingKeys.has(key)) {
    let n = 2;
    while (existingKeys.has(`${key}_${n}`)) n += 1;
    key = `${key}_${n}`;
  }

  if (copyFromKey && !existingKeys.has(copyFromKey)) {
    return { ok: false, error: "Choose a role to copy from, or leave it blank." };
  }

  const maxOrder = await prisma.organizationRole.aggregate({
    where: { organizationId },
    _max: { sortOrder: true },
  });

  await prisma.organizationRole.create({
    data: {
      organizationId,
      key,
      name: trimmed,
      locked: false,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  if (copyFromKey) {
    const [permissions, scope] = await Promise.all([
      prisma.rolePermission.findMany({
        where: { organizationId, role: copyFromKey },
      }),
      prisma.roleBrandScope.findUnique({
        where: { organizationId_role: { organizationId, role: copyFromKey } },
        include: { brands: true },
      }),
    ]);

    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((row) => ({
          organizationId,
          role: key,
          area: row.area,
          canRead: row.canRead,
          canView: row.canView,
          canEdit: row.canEdit,
        })),
        skipDuplicates: true,
      });
    }

    if (scope) {
      await prisma.roleBrandScope.create({
        data: {
          organizationId,
          role: key,
          allBrands: scope.allBrands,
          brands: scope.allBrands
            ? undefined
            : {
                create: scope.brands.map((item) => ({ brandId: item.brandId })),
              },
        },
      });
    }
  }

  return { ok: true, key };
}

export async function deleteOrganizationRole(
  organizationId: string,
  key: string,
): Promise<RoleActionResult> {
  const role = await prisma.organizationRole.findUnique({
    where: { organizationId_key: { organizationId, key } },
  });
  if (!role) {
    return { ok: false, error: "That role was not found." };
  }
  if (role.locked || key === OWNER_ROLE_KEY) {
    return { ok: false, error: "The organization owner role cannot be deleted." };
  }

  const assignedCount = await prisma.membership.count({
    where: { organizationId, role: key },
  });
  if (assignedCount > 0) {
    return {
      ok: false,
      error: "You cannot delete a role while people are assigned to it.",
    };
  }

  const pendingInviteCount = await prisma.invite.count({
    where: { organizationId, role: key, acceptedAt: null },
  });
  if (pendingInviteCount > 0) {
    return {
      ok: false,
      error: "You cannot delete a role while invites for it are still open.",
    };
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { organizationId, role: key } }),
    prisma.roleBrandScope.deleteMany({ where: { organizationId, role: key } }),
    prisma.organizationRole.delete({ where: { id: role.id } }),
  ]);

  return { ok: true, key };
}
