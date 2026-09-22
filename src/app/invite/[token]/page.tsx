import { auth } from "@/auth";
import { acceptInviteAction } from "@/actions/invite";
import { prisma } from "@/lib/prisma";
import { AuthForm } from "@/components/auth-form";
import { roleDisplayName } from "@/lib/rbac";
import { Button } from "@/components/ui";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: true },
  });
  const session = await auth();
  const orgRole = invite
    ? await prisma.organizationRole.findUnique({
        where: {
          organizationId_key: {
            organizationId: invite.organizationId,
            key: invite.role,
          },
        },
        select: { name: true },
      })
    : null;
  const roleName = invite ? roleDisplayName(invite.role, orgRole?.name) : "";

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Invite unavailable</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          This invite is missing, expired, or already used.
        </p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Join {invite.organization.name}</h1>
        <p className="mt-2 mb-8 text-sm text-[var(--muted)]">
          You were invited as {roleName}. Sign in or create an account with{" "}
          {invite.email}.
        </p>
        <AuthForm mode="login" callbackUrl={`/invite/${token}`} accountHint={false} />
        <div className="mt-6 text-sm text-[var(--muted)]">Need an account?</div>
        <div className="mt-3">
          <AuthForm mode="signup" callbackUrl={`/invite/${token}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Join {invite.organization.name}</h1>
      <p className="mt-2 mb-8 text-sm text-[var(--muted)]">
        Role: {roleName}
      </p>
      <form
        action={async () => {
          "use server";
          await acceptInviteAction(token);
        }}
      >
        <Button type="submit">Accept invite</Button>
      </form>
    </div>
  );
}
