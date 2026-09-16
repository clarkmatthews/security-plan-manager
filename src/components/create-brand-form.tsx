"use client";

import { useActionState } from "react";
import { createBrandAction } from "@/actions/org";
import { Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { currentPeriod } from "@/lib/scoring";

export function CreateBrandForm() {
  const [state, action] = useActionState(createBrandAction, undefined);

  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="name">Brand name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="period">Period</Label>
        <Input id="period" name="period" defaultValue={currentPeriod()} />
      </div>
      {state?.error ? <p className="text-sm text-[#e07a7a]">{state.error}</p> : null}
      <SubmitButton>Create brand</SubmitButton>
    </form>
  );
}
