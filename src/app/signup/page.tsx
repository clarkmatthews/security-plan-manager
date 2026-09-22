import { AuthForm } from "@/components/auth-form";
import { inviteTokenFromCallback, organizationExists } from "@/lib/signup-policy";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const callback = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "";
  const open =
    Boolean(inviteTokenFromCallback(callback)) || !(await organizationExists());
  const invited = Boolean(inviteTokenFromCallback(callback));

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      {open ? (
        <>
          <p className="mt-2 mb-8 text-sm text-[var(--muted)]">
            {invited
              ? "Use the email address on your invite."
              : "You are creating the first organization for this deployment."}
          </p>
          <AuthForm mode="signup" callbackUrl={callback || undefined} />
        </>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted)]">
          This deployment already has an organization. Ask an owner for an invite link,
          then create your account from that page.
        </p>
      )}
    </div>
  );
}
