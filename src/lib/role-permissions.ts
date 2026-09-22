import type { Prisma, PrismaClient, ProductArea } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PRODUCT_AREAS,
  defaultPermissionMap,
  emptyPermissionMap,
  normalizeAccess,
  type PermissionMap,
  type RolePermissionMatrix,
} from "@/lib/rbac";
import { ensureRoleBrandScopes } from "@/lib/brand-access";
import { ensureOrganizationRoles, listRoleKeys } from "@/lib/org-roles";

type Db = PrismaClient | Prisma.TransactionClient;

export async function ensureRolePermissions(organizationId: string, db: Db = prisma) {
  await ensureOrganizationRoles(organizationId, db);
  const roleKeys = await listRoleKeys(organizationId, db);
  const existing = await db.rolePermission.findMany({
    where: { organizationId },
    select: { role: true, area: true },
  });
  const have = new Set(existing.map((row) => `${row.role}:${row.area}`));
  const data = [];

  for (const role of roleKeys) {
    const defaults = defaultPermissionMap(role);
    for (const area of PRODUCT_AREAS) {
      const key = `${role}:${area.code}`;
      if (have.has(key)) continue;
      const access = defaults[area.code];
      data.push({
        organizationId,
        role,
        area: area.code,
        canRead: access.view,
        canView: access.view,
        canEdit: access.edit,
      });
    }
  }

  if (data.length > 0) {
    await db.rolePermission.createMany({ data, skipDuplicates: true });
  }
  await db.rolePermission.updateMany({
    where: {
      organizationId,
      area: "CONFIG",
      OR: [{ canRead: true }, { canView: true }, { canEdit: true }],
    },
    data: { canRead: false, canView: false, canEdit: false },
  });
  await ensureRoleBrandScopes(organizationId, db);
}

export async function loadPermissionMap(
  organizationId: string,
  role: string,
  isPlatformAdmin = false,
): Promise<PermissionMap> {
  await ensureRolePermissions(organizationId);
  if (isPlatformAdmin) return defaultPermissionMap("PLATFORM_ADMIN");
  const rows = await prisma.rolePermission.findMany({
    where: { organizationId, role },
  });
  const map = emptyPermissionMap();
  const fallback = defaultPermissionMap(role);
  for (const area of PRODUCT_AREAS) {
    const row = rows.find((item) => item.area === area.code);
    map[area.code] = normalizeAccess(
      row
        ? { view: row.canView || row.canRead, edit: row.canEdit }
        : fallback[area.code],
    );
  }
  map.CONFIG = { view: false, edit: false };
  return map;
}

export async function loadPermissionMatrix(
  organizationId: string,
): Promise<RolePermissionMatrix> {
  await ensureRolePermissions(organizationId);
  const roleKeys = await listRoleKeys(organizationId);
  const rows = await prisma.rolePermission.findMany({
    where: { organizationId },
  });
  const matrix: RolePermissionMatrix = {};
  for (const role of roleKeys) {
    matrix[role] = emptyPermissionMap();
    const fallback = defaultPermissionMap(role);
    for (const area of PRODUCT_AREAS) {
      const row = rows.find((item) => item.role === role && item.area === area.code);
      matrix[role][area.code] = normalizeAccess(
        row
          ? { view: row.canView || row.canRead, edit: row.canEdit }
          : fallback[area.code],
      );
    }
  }
  return matrix;
}

export async function savePermissionMatrix(
  organizationId: string,
  matrix: RolePermissionMatrix,
) {
  const roleKeys = Object.keys(matrix);
  const operations = roleKeys.flatMap((role) =>
    PRODUCT_AREAS.map((area) => {
      const access = normalizeAccess(matrix[role][area.code]);
      return prisma.rolePermission.upsert({
        where: {
          organizationId_role_area: {
            organizationId,
            role,
            area: area.code as ProductArea,
          },
        },
        update: {
          canRead: access.view,
          canView: access.view,
          canEdit: access.edit,
        },
        create: {
          organizationId,
          role,
          area: area.code as ProductArea,
          canRead: access.view,
          canView: access.view,
          canEdit: access.edit,
        },
      });
    }),
  );
  await prisma.$transaction(operations);
}
