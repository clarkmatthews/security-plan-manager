"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, signupAction } from "@/actions/auth";
import { Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function AuthForm({
  mode,
  callbackUrl,
}: {
  mode: "login" | "signup";
  callbackUrl?: string;
}) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      {mode === "signup" ? (
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
      ) : null}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      {state?.error ? <p className="text-sm text-[#e07a7a]">{state.error}</p> : null}
      <SubmitButton>{mode === "login" ? "Sign in" : "Create account"}</SubmitButton>
      <p className="text-sm text-[var(--muted)]">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="text-[var(--foreground)] underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already registered?{" "}
            <Link href="/login" className="text-[var(--foreground)] underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
