"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireArea } from "@/lib/auth-guard";
import {
  ACCESS_MODES,
  ROLE_MATRIX_AREAS,
  accessFromMode,
  emptyPermissionMap,
  type AccessMode,
  type RolePermissionMatrix,
} from "@/lib/rbac";
import { ensureRolePermissions, savePermissionMatrix } from "@/lib/role-permissions";
import {
  saveRoleBrandScopes,
  scopesForRoles,
  type RoleBrandScopeMap,
} from "@/lib/brand-access";
import {
  createOrganizationRole,
  deleteOrganizationRole,
  listRoleKeys,
} from "@/lib/org-roles";
import { prisma } from "@/lib/prisma";

export type RolePermissionsState = { error?: string; ok?: boolean } | undefined;
export type RoleMutationState = { error?: string; ok?: boolean } | undefined;

function parseMode(value: FormDataEntryValue | null): AccessMode {
  const text = String(value ?? "none");
  return ACCESS_MODES.some((mode) => mode.code === text) ? (text as AccessMode) : "none";
}

function parseRoleKeys(formData: FormData, validKeys: string[]) {
  const allowed = new Set(validKeys);
  const fromForm = formData
    .getAll("roleKey")
    .map((value) => String(value))
    .filter((key) => allowed.has(key));
  return fromForm.length > 0 ? fromForm : validKeys;
}

function parseMatrix(formData: FormData, roleKeys: string[]): RolePermissionMatrix {
  const matrix: RolePermissionMatrix = {};
  for (const role of roleKeys) {
    matrix[role] = emptyPermissionMap();
    for (const area of ROLE_MATRIX_AREAS) {
      matrix[role][area.code] = accessFromMode(parseMode(formData.get(`${role}:${area.code}`)));
    }
    matrix[role].CONFIG = { view: false, edit: false };
  }
  return matrix;
}

function parseBrandScopes(formData: FormData, roleKeys: string[], brandIds: string[]): RoleBrandScopeMap {
  const scopes = scopesForRoles(roleKeys);
  for (const role of roleKeys) {
    const selected = brandIds.filter(
      (brandId) => formData.get(`brand:${role}:${brandId}`) === "on",
    );
    scopes[role] = {
      allBrands: String(formData.get(`brandMode:${role}`)) !== "selected",
      brandIds: selected,
    };
  }
  return scopes;
}

export async function saveRolePermissionsAction(
  _prev: RolePermissionsState,
  formData: FormData,
): Promise<RolePermissionsState> {
  const membership = await requireArea("ROLES", "edit");
  const roleKeys = await listRoleKeys(membership.organizationId);
  const selectedKeys = parseRoleKeys(formData, roleKeys);
  const matrix = parseMatrix(formData, selectedKeys);

  const ownAccess = matrix[membership.role] ?? emptyPermissionMap();
  if (!ownAccess.ROLES.edit && !membership.isPlatformAdmin) {
    return { error: "You cannot remove Edit on Roles from your own role." };
  }

  const someoneCanEditRoles = selectedKeys.some((role) => matrix[role].ROLES.edit);
  if (!someoneCanEditRoles) {
    return { error: "At least one role must keep Edit access to Roles." };
  }

  const brands = await prisma.brand.findMany({
    where: { organizationId: membership.organizationId },
    select: { id: true },
  });
  const brandIds = brands.map((brand) => brand.id);
  const scopes = parseBrandScopes(formData, selectedKeys, brandIds);

  await savePermissionMatrix(membership.organizationId, matrix);
  await saveRoleBrandScopes(membership.organizationId, scopes, brandIds);
  revalidatePath("/app", "layout");
  revalidatePath("/app/settings/roles");
  revalidatePath("/app/settings/people");
  return { ok: true };
}

export async function createRoleAction(
  _prev: RoleMutationState,
  formData: FormData,
): Promise<RoleMutationState> {
  const membership = await requireArea("ROLES", "edit");
  const name = String(formData.get("name") ?? "");
  const copyFrom = String(formData.get("copyFrom") ?? "").trim();
  const result = await createOrganizationRole(
    membership.organizationId,
    name,
    copyFrom || undefined,
  );
  if (!result.ok) return { error: result.error };

  await ensureRolePermissions(membership.organizationId);
  revalidatePath("/app", "layout");
  revalidatePath("/app/settings/roles");
  revalidatePath("/app/settings/people");
  redirect(`/app/settings/roles?role=${encodeURIComponent(result.key)}`);
}

export async function deleteRoleAction(
  _prev: RoleMutationState,
  formData: FormData,
): Promise<RoleMutationState> {
  const membership = await requireArea("ROLES", "edit");
  const roleKey = String(formData.get("roleKey") ?? "").trim();
  if (!roleKey) {
    return { error: "Choose a role to delete." };
  }
  if (roleKey === membership.role) {
    return { error: "You cannot delete the role you are currently assigned." };
  }

  const result = await deleteOrganizationRole(membership.organizationId, roleKey);
  if (!result.ok) return { error: result.error };

  revalidatePath("/app", "layout");
  revalidatePath("/app/settings/roles");
  revalidatePath("/app/settings/people");
  return { ok: true };
}
