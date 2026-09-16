import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { listRoleKeys } from "@/lib/org-roles";

type Db = PrismaClient | Prisma.TransactionClient;

export type BrandScope = {
  allBrands: boolean;
  brandIds: string[];
};

export type RoleBrandScopeMap = Record<string, BrandScope>;

export type BrandAccessMembership = {
  organizationId: string;
  isPlatformAdmin: boolean;
  allBrands: boolean;
  allowedBrandIds: string[];
};

export function emptyBrandScope(): BrandScope {
  return { allBrands: true, brandIds: [] };
}

export function scopesForRoles(roleKeys: string[]): RoleBrandScopeMap {
  return Object.fromEntries(roleKeys.map((role) => [role, emptyBrandScope()]));
}

export function scopeToAccess(
  organizationId: string,
  isPlatformAdmin: boolean,
  scope: BrandScope,
): BrandAccessMembership {
  return {
    organizationId,
    isPlatformAdmin,
    allBrands: isPlatformAdmin || scope.allBrands,
    allowedBrandIds: isPlatformAdmin || scope.allBrands ? [] : scope.brandIds,
  };
}

export function hasBrandAccess(membership: BrandAccessMembership, brandId: string) {
  if (membership.isPlatformAdmin || membership.allBrands) return true;
  return membership.allowedBrandIds.includes(brandId);
}

export function brandWhereFor(membership: BrandAccessMembership): Prisma.BrandWhereInput {
  if (membership.isPlatformAdmin || membership.allBrands) {
    return { organizationId: membership.organizationId };
  }
  return {
    organizationId: membership.organizationId,
    id: { in: membership.allowedBrandIds },
  };
}

export async function listAccessibleBrands(membership: BrandAccessMembership) {
  return prisma.brand.findMany({
    where: brandWhereFor(membership),
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function ensureRoleBrandScopes(organizationId: string, db: Db = prisma) {
  const roleKeys = await listRoleKeys(organizationId, db);
  const existing = await db.roleBrandScope.findMany({
    where: { organizationId },
    select: { role: true },
  });
  const have = new Set(existing.map((row) => row.role));
  const missing = roleKeys.filter((role) => !have.has(role));
  if (missing.length === 0) return;
  await db.roleBrandScope.createMany({
    data: missing.map((role) => ({
      organizationId,
      role,
      allBrands: true,
    })),
    skipDuplicates: true,
  });
}

function rowToScope(row: { allBrands: boolean; brands: { brandId: string }[] } | null): BrandScope {
  if (!row || row.allBrands) return emptyBrandScope();
  return { allBrands: false, brandIds: row.brands.map((item) => item.brandId) };
}

export async function loadRoleBrandScope(
  organizationId: string,
  role: string,
): Promise<BrandScope> {
  await ensureRoleBrandScopes(organizationId);
  const row = await prisma.roleBrandScope.findUnique({
    where: { organizationId_role: { organizationId, role } },
    include: { brands: { select: { brandId: true } } },
  });
  return rowToScope(row);
}

export async function loadRoleBrandScopes(
  organizationId: string,
): Promise<RoleBrandScopeMap> {
  await ensureRoleBrandScopes(organizationId);
  const roleKeys = await listRoleKeys(organizationId);
  const rows = await prisma.roleBrandScope.findMany({
    where: { organizationId },
    include: { brands: { select: { brandId: true } } },
  });
  const map = scopesForRoles(roleKeys);
  for (const row of rows) {
    if (!(row.role in map)) continue;
    map[row.role] = rowToScope(row);
  }
  return map;
}

export async function saveRoleBrandScopes(
  organizationId: string,
  scopes: RoleBrandScopeMap,
  validBrandIds: string[],
) {
  const allowed = new Set(validBrandIds);
  const roleKeys = Object.keys(scopes);
  await prisma.$transaction(async (tx) => {
    await ensureRoleBrandScopes(organizationId, tx);
    for (const role of roleKeys) {
      const raw = scopes[role] ?? emptyBrandScope();
      const brandIds = raw.allBrands
        ? []
        : [...new Set(raw.brandIds.filter((id) => allowed.has(id)))];
      const scope: BrandScope = {
        allBrands: raw.allBrands || brandIds.length === 0,
        brandIds: raw.allBrands || brandIds.length === 0 ? [] : brandIds,
      };

      const row = await tx.roleBrandScope.upsert({
        where: {
          organizationId_role: { organizationId, role },
        },
        update: { allBrands: scope.allBrands },
        create: { organizationId, role, allBrands: scope.allBrands },
      });
      await tx.roleBrandAccess.deleteMany({ where: { scopeId: row.id } });
      if (!scope.allBrands) {
        await tx.roleBrandAccess.createMany({
          data: scope.brandIds.map((brandId) => ({ scopeId: row.id, brandId })),
          skipDuplicates: true,
        });
      }
    }
  });
}
