"use client";

import { useActionState } from "react";
import { createRoleAction } from "@/actions/roles";
import { Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { OrgRole } from "@/lib/org-roles";

export function AddRoleForm({ roles }: { roles: OrgRole[] }) {
  const [state, action] = useActionState(createRoleAction, undefined);

  return (
    <form action={action} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
      <div>
        <h2 className="font-medium">Add a role</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          New roles start with no product access unless you copy an existing role.
        </p>
      </div>
      <div>
        <Label htmlFor="role-name">Name</Label>
        <Input id="role-name" name="name" required minLength={2} maxLength={60} />
      </div>
      <div>
        <Label htmlFor="copy-from">Copy permissions from</Label>
        <Select id="copy-from" name="copyFrom" defaultValue="">
          <option value="">None — start empty</option>
          {roles.map((role) => (
            <option key={role.key} value={role.key}>
              {role.name}
            </option>
          ))}
        </Select>
      </div>
      {state?.error ? <p className="text-sm text-[#e07a7a]">{state.error}</p> : null}
      <SubmitButton>Create role</SubmitButton>
    </form>
  );
}
