import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <p className="mt-2 mb-8 text-sm text-[var(--muted)]">
        Start an organization, then invite your CSO, assessors, and board viewers.
      </p>
      <AuthForm mode="signup" />
    </div>
  );
}
