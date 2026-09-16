"use client";

import { useActionState, useState, useTransition } from "react";
import { setMemberActiveAction, updateMemberRoleAction } from "@/actions/people";
import { Select } from "@/components/ui";
import { isOwnerRole, roleDisplayName } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export type RosterRole = { key: string; name: string };

export type RosterMember = {
  id: string;
  role: string;
  active: boolean;
  userId: string;
  name: string;
  email: string | null;
};

export function PeopleRoster({
  members,
  roles,
  currentUserId,
  canEdit,
  canAssignOwner,
}: {
  members: RosterMember[];
  roles: RosterRole[];
  currentUserId: string;
  canEdit: boolean;
  canAssignOwner: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(updateMemberRoleAction, undefined);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const assignableRoles = roles.filter((role) => !isOwnerRole(role.key) || canAssignOwner);
  const roleName = (key: string) =>
    roleDisplayName(key, roles.find((role) => role.key === key)?.name);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              {canEdit ? <th className="px-4 py-3">Access</th> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelf = member.userId === currentUserId;
              const ownerLocked = isOwnerRole(member.role) && !canAssignOwner;
              return (
                <tr
                  key={member.id}
                  className={cn(
                    "border-t border-[var(--border)]",
                    !member.active && "opacity-60",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{member.name}</span>
                      {isSelf ? (
                        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                          You
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[var(--muted)]">{member.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit && !ownerLocked ? (
                      <form action={roleAction}>
                        <input type="hidden" name="membershipId" value={member.id} />
                        <Select
                          key={`${member.id}-${member.role}`}
                          name="role"
                          defaultValue={member.role}
                          className="min-w-[190px]"
                          disabled={rolePending || pending}
                          onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        >
                          {assignableRoles.map((role) => (
                            <option key={role.key} value={role.key}>
                              {role.name}
                            </option>
                          ))}
                        </Select>
                      </form>
                    ) : (
                      roleName(member.role)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {member.active ? "Active" : "Deactivated"}
                  </td>
                  {canEdit ? (
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-[var(--muted)]">—</span>
                      ) : ownerLocked ? (
                        <span className="text-xs text-[var(--muted)]">Owner</span>
                      ) : confirmDeactivateId === member.id ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-[var(--muted)]">They will not be able to sign in.</span>
                          <button
                            type="button"
                            className="text-[var(--accent)] underline disabled:opacity-50"
                            disabled={pending && pendingId === member.id}
                            onClick={() => {
                              setStatusError(null);
                              setPendingId(member.id);
                              startTransition(async () => {
                                const result = await setMemberActiveAction(member.id, false);
                                if (result?.error) setStatusError(result.error);
                                setConfirmDeactivateId(null);
                                setPendingId(null);
                              });
                            }}
                          >
                            {pending && pendingId === member.id ? "Saving…" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            className="text-[var(--muted)] underline"
                            onClick={() => setConfirmDeactivateId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-sm text-[var(--accent)] underline disabled:opacity-50"
                          disabled={pending && pendingId === member.id}
                          onClick={() => {
                            if (member.active) {
                              setConfirmDeactivateId(member.id);
                              return;
                            }
                            setStatusError(null);
                            setPendingId(member.id);
                            startTransition(async () => {
                              const result = await setMemberActiveAction(member.id, true);
                              if (result?.error) setStatusError(result.error);
                              setPendingId(null);
                            });
                          }}
                        >
                          {pending && pendingId === member.id
                            ? "Saving…"
                            : member.active
                              ? "Deactivate"
                              : "Reactivate"}
                        </button>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {roleState?.error ? <p className="text-sm text-[#e07a7a]">{roleState.error}</p> : null}
      {roleState?.ok ? <p className="text-sm text-[#4faf78]">Role updated.</p> : null}
      {statusError ? <p className="text-sm text-[#e07a7a]">{statusError}</p> : null}
    </div>
  );
}
