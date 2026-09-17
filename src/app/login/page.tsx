import { AuthForm } from "@/components/auth-form";
import { isDemoLoginEnabled } from "@/lib/demo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const deactivated = error === "deactivated";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 mb-8 text-sm text-[var(--muted)]">
        Continue to your NIST CSF workspace.
      </p>
      {deactivated ? (
        <p className="mb-4 text-sm text-[#e07a7a]">
          This account has been deactivated. Contact an organization owner to restore access.
        </p>
      ) : null}
      <AuthForm mode="login" />
      {isDemoLoginEnabled() ? (
        <div className="mt-8 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
          <div className="mb-1 font-medium text-[var(--foreground)]">Demo accounts</div>
          <p>CISO: ciso@apex.example</p>
          <p>Analyst: analyst@apex.example</p>
          <p>Board viewer: board@apex.example</p>
          <p className="mt-1">Password for all: ChangeMe123!</p>
        </div>
      ) : null}
    </div>
  );
}
