"use client";

import { useActionState, useMemo, useState } from "react";
import { deleteRoleAction, saveRolePermissionsAction } from "@/actions/roles";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui";
import {
  ACCESS_MODES,
  PRODUCT_AREAS,
  accessFromMode,
  accessMode,
  isOwnerRole,
  type AccessMode,
  type ProductAreaCode,
  type RolePermissionMatrix,
} from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { HeadingWithHelp, HelpTip } from "@/components/help-tip";
import type { RoleBrandScopeMap } from "@/lib/brand-access";
import type { OrgRole } from "@/lib/org-roles";

export function RolePermissionsForm({
  roles,
  initialMatrix,
  initialBrandScopes,
  brands,
  canEdit,
  initialSelectedRole,
}: {
  roles: OrgRole[];
  initialMatrix: RolePermissionMatrix;
  initialBrandScopes: RoleBrandScopeMap;
  brands: { id: string; name: string }[];
  canEdit: boolean;
  initialSelectedRole?: string;
}) {
  const roleKeys = useMemo(() => roles.map((role) => role.key), [roles]);
  const roleByKey = useMemo(
    () => Object.fromEntries(roles.map((role) => [role.key, role])),
    [roles],
  );
  const [matrix, setMatrix] = useState(initialMatrix);
  const [brandScopes, setBrandScopes] = useState(initialBrandScopes);
  const fallbackRole = roleKeys.includes("CISO")
    ? "CISO"
    : roleKeys.includes("CSO")
      ? "CSO"
      : (roleKeys[0] ?? "ORG_OWNER");
  const [selectedRole, setSelectedRole] = useState(
    initialSelectedRole && roleByKey[initialSelectedRole] ? initialSelectedRole : fallbackRole,
  );
  const activeRole = roleByKey[selectedRole]?.key ?? fallbackRole;
  const [state, action] = useActionState(saveRolePermissionsAction, undefined);
  const [deleteState, deleteAction] = useActionState(deleteRoleAction, undefined);

  function setMode(role: string, area: ProductAreaCode, mode: AccessMode) {
    setMatrix((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [area]: accessFromMode(mode),
      },
    }));
  }

  const selected = roleByKey[activeRole];
  const selectedScope = brandScopes[activeRole] ?? { allBrands: true, brandIds: [] };
  const selectedLabel = selected?.name ?? activeRole;
  const assignedCount = selected?.assignedCount ?? 0;
  const pendingInviteCount = selected?.pendingInviteCount ?? 0;
  const canDelete =
    canEdit &&
    selected &&
    !selected.locked &&
    !isOwnerRole(selected.key) &&
    assignedCount === 0 &&
    pendingInviteCount === 0;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        {roleKeys.map((role) => (
          <input key={role} type="hidden" name="roleKey" value={role} />
        ))}
        {roleKeys.flatMap((role) =>
          PRODUCT_AREAS.map((area) => (
            <input
              key={`${role}:${area.code}`}
              type="hidden"
              name={`${role}:${area.code}`}
              value={accessMode(matrix[role]?.[area.code] ?? { view: false, edit: false })}
            />
          )),
        )}
        {roleKeys.map((role) => (
          <input
            key={`brandMode:${role}`}
            type="hidden"
            name={`brandMode:${role}`}
            value={brandScopes[role]?.allBrands === false ? "selected" : "all"}
          />
        ))}
        {roleKeys.flatMap((role) =>
          brandScopes[role]?.allBrands
            ? []
            : (brandScopes[role]?.brandIds ?? []).map((brandId) => (
                <input
                  key={`brand:${role}:${brandId}`}
                  type="hidden"
                  name={`brand:${role}:${brandId}`}
                  value="on"
                />
              )),
        )}

        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => setSelectedRole(role.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                activeRole === role.key
                  ? "border-[var(--accent)] bg-[var(--surface-2)] text-[var(--foreground)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              {role.name}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                    Area
                    <HelpTip topic="rolesMatrix" />
                  </span>
                </th>
                {ACCESS_MODES.map((mode) => (
                  <th key={mode.code} className="px-4 py-3">
                    {mode.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCT_AREAS.map((area) => {
                const mode = accessMode(
                  matrix[activeRole]?.[area.code] ?? { view: false, edit: false },
                );
                return (
                  <tr key={area.code} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">
                      <div className="font-medium">{area.label}</div>
                      <div className="text-xs text-[var(--muted)]">{area.description}</div>
                    </td>
                    {ACCESS_MODES.map((option) => (
                      <td key={option.code} className="px-4 py-3">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name={`ui:${activeRole}:${area.code}`}
                            checked={mode === option.code}
                            disabled={!canEdit}
                            onChange={() => setMode(activeRole, area.code, option.code)}
                          />
                          <span className="sr-only">
                            {option.label} {area.label} for {selectedLabel}
                          </span>
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ul className="grid gap-1 text-sm text-[var(--muted)] sm:grid-cols-3">
          {ACCESS_MODES.map((mode) => (
            <li key={mode.code}>
              <span className="font-medium text-[var(--foreground)]">{mode.label}.</span>{" "}
              {mode.description}
            </li>
          ))}
        </ul>

        {brands.length > 0 ? (
          <div className="rounded-xl border border-[var(--border)] p-4">
            <HeadingWithHelp as="h2" topic="brandAccess" className="font-medium">
              Brand access
            </HeadingWithHelp>
            <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
              People with {selectedLabel} can open these programs.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name={`ui-brand-mode:${activeRole}`}
                  checked={selectedScope.allBrands}
                  disabled={!canEdit}
                  onChange={() =>
                    setBrandScopes((current) => ({
                      ...current,
                      [activeRole]: { ...current[activeRole], allBrands: true },
                    }))
                  }
                />
                All brands
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name={`ui-brand-mode:${activeRole}`}
                  checked={!selectedScope.allBrands}
                  disabled={!canEdit}
                  onChange={() =>
                    setBrandScopes((current) => ({
                      ...current,
                      [activeRole]: {
                        ...current[activeRole],
                        allBrands: false,
                        brandIds:
                          current[activeRole]?.brandIds.length > 0
                            ? current[activeRole].brandIds
                            : brands.map((brand) => brand.id),
                      },
                    }))
                  }
                />
                Selected brands
              </label>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {brands.map((brand) => {
                const checked =
                  selectedScope.allBrands || selectedScope.brandIds.includes(brand.id);
                return (
                  <label
                    key={brand.id}
                    className={cn(
                      "inline-flex items-center gap-2 text-sm",
                      selectedScope.allBrands && "text-[var(--muted)]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!canEdit || selectedScope.allBrands}
                      onChange={(event) => {
                        const on = event.target.checked;
                        setBrandScopes((current) => {
                          const ids = new Set(current[activeRole]?.brandIds ?? []);
                          if (on) ids.add(brand.id);
                          else ids.delete(brand.id);
                          return {
                            ...current,
                            [activeRole]: {
                              allBrands: false,
                              brandIds: brands
                                .map((item) => item.id)
                                .filter((id) => ids.has(id)),
                            },
                          };
                        });
                      }}
                    />
                    {brand.name}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>Save permissions</SubmitButton>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMatrix(initialMatrix);
                setBrandScopes(initialBrandScopes);
              }}
            >
              Reset changes
            </Button>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            You can view this matrix. Only roles with Edit on Roles can change it.
          </p>
        )}
        {state?.error ? <p className="text-sm text-[#e07a7a]">{state.error}</p> : null}
        {state?.ok ? <p className="text-sm text-[#4faf78]">Permissions saved.</p> : null}
      </form>

      {canEdit && selected ? (
        <div className="rounded-xl border border-[var(--border)] p-4">
          <h2 className="font-medium">Delete {selected.name}</h2>
          {canDelete ? (
            <form
              action={deleteAction}
              className="mt-3 flex flex-wrap items-center gap-3"
              onSubmit={(event) => {
                if (!window.confirm(`Delete the ${selected.name} role?`)) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="roleKey" value={selected.key} />
              <SubmitButton variant="danger">Delete role</SubmitButton>
              <p className="text-sm text-[var(--muted)]">
                This role has no one assigned and no open invites.
              </p>
            </form>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">
              {selected.locked || isOwnerRole(selected.key)
                ? "The organization owner role cannot be deleted."
                : assignedCount > 0
                  ? `You cannot delete this role while ${assignedCount} ${
                      assignedCount === 1 ? "person is" : "people are"
                    } assigned to it.`
                  : pendingInviteCount > 0
                    ? `You cannot delete this role while ${pendingInviteCount} ${
                        pendingInviteCount === 1 ? "invite is" : "invites are"
                      } still open.`
                    : "This role cannot be deleted."}
            </p>
          )}
          {deleteState?.error ? (
            <p className="mt-2 text-sm text-[#e07a7a]">{deleteState.error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
