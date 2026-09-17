"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/actions/org";
import { Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function OnboardingForm() {
  const [state, action] = useActionState(completeOnboarding, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="organizationName">Organization</Label>
        <Input id="organizationName" name="organizationName" required />
      </div>
      <div>
        <Label htmlFor="brandName">First brand or business unit</Label>
        <Input id="brandName" name="brandName" required />
      </div>
      {state?.error ? <p className="text-sm text-[#e07a7a]">{state.error}</p> : null}
      <SubmitButton>Create workspace</SubmitButton>
    </form>
  );
}
