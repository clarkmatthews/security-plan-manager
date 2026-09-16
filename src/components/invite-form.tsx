"use client";

import { useActionState } from "react";
import { createInviteAction } from "@/actions/invite";
import { Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { isOwnerRole } from "@/lib/rbac";

export function InviteForm({
  origin,
  canAssignOwner,
  roles,
}: {
  origin: string;
  canAssignOwner: boolean;
  roles: { key: string; name: string }[];
}) {
  const [state, action] = useActionState(createInviteAction, undefined);
  const inviteUrl = state?.token ? `${origin}/invite/${state.token}` : null;
  const options = roles.filter((role) => !isOwnerRole(role.key) || canAssignOwner);
  const defaultRole =
    options.find((role) => role.key === "ASSESSOR")?.key ?? options[0]?.key ?? "";

  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select id="role" name="role" defaultValue={defaultRole}>
          {options.map((role) => (
            <option key={role.key} value={role.key}>
              {role.name}
            </option>
          ))}
        </Select>
      </div>
      {state?.error ? <p className="text-sm text-[#e07a7a]">{state.error}</p> : null}
      {inviteUrl ? (
        <p className="text-sm text-[#4faf78]">
          Invite created. Share this link: {inviteUrl}
        </p>
      ) : null}
      <SubmitButton>Create invite</SubmitButton>
    </form>
  );
}
