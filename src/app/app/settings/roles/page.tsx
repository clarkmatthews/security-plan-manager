import { requireArea } from "@/lib/auth-guard";
import { loadPermissionMatrix } from "@/lib/role-permissions";
import { RolePermissionsForm } from "@/components/role-permissions-form";
import { AddRoleForm } from "@/components/add-role-form";
import { hasAccess } from "@/lib/rbac";
import { loadRoleBrandScopes } from "@/lib/brand-access";
import { listOrganizationRoles } from "@/lib/org-roles";
import { prisma } from "@/lib/prisma";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const membership = await requireArea("ROLES", "view");
  const { role: selectedRole } = await searchParams;
  const [roles, matrix, brandScopes, brands] = await Promise.all([
    listOrganizationRoles(membership.organizationId),
    loadPermissionMatrix(membership.organizationId),
    loadRoleBrandScopes(membership.organizationId),
    prisma.brand.findMany({
      where: { organizationId: membership.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const canEdit = hasAccess(membership.permissions, "ROLES", "edit");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Roles</h1>
        <p className="mt-2 max-w-3xl text-[var(--muted)]">
          Add or remove roles, then set View or Edit access for each area of the product and
          which brands people in that role can open. Edit includes View. You cannot delete a
          role while someone is assigned to it.
        </p>
      </div>
      {canEdit ? <AddRoleForm roles={roles} /> : null}
      <RolePermissionsForm
        roles={roles}
        initialMatrix={matrix}
        initialBrandScopes={brandScopes}
        brands={brands}
        canEdit={canEdit}
        initialSelectedRole={selectedRole}
      />
    </div>
  );
}
