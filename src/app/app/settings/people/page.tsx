import { headers } from "next/headers";
import { requireArea } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "@/components/invite-form";
import { PeopleRoster } from "@/components/people-roster";
import { HeadingWithHelp } from "@/components/help-tip";
import { Card } from "@/components/ui";
import { listOrganizationRoles } from "@/lib/org-roles";
import { roleDisplayName } from "@/lib/rbac";

export default async function PeoplePage() {
  const membership = await requireArea("PEOPLE", "view");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;
  const canAssignOwner = membership.isOwner || membership.isPlatformAdmin;

  const [members, invites, roles] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: membership.organizationId },
      include: { user: true },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    }),
    prisma.invite.findMany({
      where: { organizationId: membership.organizationId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    listOrganizationRoles(membership.organizationId),
  ]);
  const roleOptions = roles.map((role) => ({ key: role.key, name: role.name }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div>
          <HeadingWithHelp className="text-3xl font-semibold" topic="people">
            People
          </HeadingWithHelp>
          <p className="mt-2 text-[var(--muted)]">
            Change roles or deactivate people. Brand access comes from the role on the Roles page.
          </p>
        </div>
        <PeopleRoster
          currentUserId={membership.userId}
          canEdit={membership.permissions.PEOPLE.edit}
          canAssignOwner={canAssignOwner}
          roles={roleOptions}
          members={members.map((member) => ({
            id: member.id,
            role: member.role,
            active: member.active,
            userId: member.userId,
            name: member.user.name ?? "Unnamed",
            email: member.user.email,
          }))}
        />
        {invites.length > 0 ? (
          <Card>
            <h2 className="mb-3 font-medium">Open invites</h2>
            <ul className="space-y-2 text-sm">
              {invites.map((invite) => (
                <li key={invite.id} className="flex justify-between gap-4">
                  <span>
                    {invite.email} ·{" "}
                    {roleDisplayName(
                      invite.role,
                      roles.find((role) => role.key === invite.role)?.name,
                    )}
                  </span>
                  <span className="text-[var(--muted)]">
                    expires {invite.expiresAt.toISOString().slice(0, 10)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
      {membership.permissions.PEOPLE.edit ? (
        <Card>
          <h2 className="mb-4 text-lg font-medium">Invite someone</h2>
          <InviteForm origin={origin} canAssignOwner={canAssignOwner} roles={roleOptions} />
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            You can view the roster. Your role does not include Edit on People.
          </p>
        </Card>
      )}
    </div>
  );
}
